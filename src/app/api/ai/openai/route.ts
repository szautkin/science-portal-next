import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * Direct OpenAI API route
 *
 * This route uses the OpenAI SDK directly to make API calls,
 * bypassing the MCP client for code generation use cases.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompt is required',
        },
        { status: 400 }
      );
    }

    if (!body.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key is required',
        },
        { status: 400 }
      );
    }

    const {
      prompt,
      apiKey,
      modelName = 'gpt-4-turbo',
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
    } = body;

    console.log('[OpenAI API] Making request:', {
      model: modelName,
      promptLength: prompt.length,
      temperature,
      maxTokens,
    });

    // Initialize OpenAI client with user's API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 420000); // 7 minutes

    let completion: OpenAI.Chat.ChatCompletion;

    try {
      completion = await openai.chat.completions.create(
        {
          model: modelName,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        },
        {
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Extract response
    const responseContent = completion.choices[0]?.message?.content || '';
    const finishReason = completion.choices[0]?.finish_reason || 'stop';

    console.log('[OpenAI API] Request successful:', {
      model: completion.model,
      usage: completion.usage,
      finishReason,
      responseLength: responseContent.length,
    });

    // Return response in expected format
    return NextResponse.json({
      success: true,
      data: {
        response: responseContent,
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        finishReason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[OpenAI API] Error:', error);

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timed out after 7 minutes. Please try a simpler prompt.',
        },
        { status: 504 }
      );
    }

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      console.error('[OpenAI API] OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - reject GET requests
 */
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
