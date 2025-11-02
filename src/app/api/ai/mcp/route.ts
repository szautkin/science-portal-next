import { NextRequest, NextResponse } from 'next/server';
import { ErrorResponses, SuccessResponse } from '../../utils/errorHandler';

const MCP_ENDPOINT =
  process.env.MCP_ENDPOINT || 'https://canfar-ai-mcp-client.testapp.ca/ask';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.prompt) {
      return ErrorResponses.BadRequest('Prompt is required');
    }

    if (!body.apiKey) {
      return ErrorResponses.BadRequest('API key is required');
    }

    // Prepare the request for MCP client
    const mcpRequest = {
      prompt: body.prompt,
      model: 'openai', // MCP client expects "openai" as the model
      apiKey: body.apiKey,
      modelName: body.modelName || 'gpt-4.1-mini', // Pass the specific model name, default to gpt-4.1-mini
    };

    // Forward request to MCP client endpoint with extended timeout (7 minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 420000); // 7 minutes timeout

    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mcpRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error details - could be JSON, HTML, or plain text
      const contentType = response.headers.get('content-type') || '';
      let errorMessage = `MCP client error (${response.status})`;

      try {
        const errorText = await response.text();

        // Check if it's a JSON error response
        if (contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorText;
          } catch {
            errorMessage = errorText;
          }
        } else if (response.status === 504) {
          // Gateway timeout - provide helpful message
          errorMessage =
            'Request timed out. The operation is taking longer than expected. Please try again with a simpler query or wait a moment and retry.';
        } else {
          // HTML or plain text error
          errorMessage = errorText.substring(0, 200); // Limit error message length
        }
      } catch {
        // If we can't read the response body
        errorMessage = `MCP client returned ${response.status} ${response.statusText}`;
      }

      console.error('MCP client error response:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        errorMessage,
        request: {
          prompt: body.prompt.substring(0, 100) + '...',
          model: 'openai',
        },
      });

      return ErrorResponses.InternalError(errorMessage);
    }

    // For successful responses, MCP client should return JSON
    let responseData;

    try {
      const data = await response.json();

      console.log('MCP client successful response:', {
        hasModelResponse: !!data.modelResponse,
        responseKeys: Object.keys(data),
        prompt: body.prompt.substring(0, 100) + '...', // Log first 100 chars of prompt
      });

      // Extract the HTML response from the modelResponse field
      responseData = data.modelResponse;

      if (!responseData) {
        console.warn(
          'MCP client returned JSON but no modelResponse field:',
          data
        );
        responseData = data.data || JSON.stringify(data);
      }
    } catch (parseError) {
      // If JSON parsing fails on a successful response, something is wrong
      console.error('Failed to parse MCP client response as JSON:', parseError);

      // Try to get the raw text
      const rawText = await response.text();
      return ErrorResponses.InternalError(
        'MCP client returned invalid response format. Please try again.'
      );
    }

    // Return the response in our expected format
    return SuccessResponse({
      response: responseData,
      model: 'openai',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      },
      finishReason: 'stop',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MCP route error:', error);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return ErrorResponses.InternalError(
        'Request timed out. The query may be taking longer than expected. Please try again with a simpler query.'
      );
    }

    return ErrorResponses.InternalError(
      error instanceof Error ? error.message : 'Failed to process request'
    );
  }
}

// Reject GET requests
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      message: 'Use POST method to send prompts',
    },
    { status: 405 }
  );
}
