/**
 * VOSpace Client
 *
 * Client for interacting with CANFAR VOSpace storage API (Arc service).
 * Handles all node operations (list, create, read, delete, update).
 */

import { fetchExternalApi } from '@/app/api/lib/api-utils';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import {
  VONode,
  parseNodeResponse,
  parseNodeList,
  generateContainerNode,
  generateDataNode,
  generatePropertyUpdate,
  generateTransferRequest,
} from './vospace-xml';
import { toVOSpaceURI, normalizePath, sanitizePath } from './vospace-utils';

/**
 * VOSpace client configuration
 */
export interface VOSpaceConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * Transfer endpoint response
 */
interface TransferEndpoint {
  url: string;
  protocol: string;
}

/**
 * VOSpace Client class
 */
export class VOSpaceClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: VOSpaceConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
  }

  /**
   * Lists nodes in a directory
   *
   * @param path - Directory path to list
   * @param token - Authorization token
   * @returns Array of VONodes
   */
  async listNodes(path: string, token: string): Promise<VONode[]> {
    const normalizedPath = normalizePath(path);
    const endpoint = `${this.baseUrl}/nodes/${normalizedPath}`;

    // Add query parameters for detailed listing
    const url = new URL(endpoint);
    url.searchParams.set('detail', 'max');
    url.searchParams.set('limit', '1000');

    const response = await fetchExternalApi(
      url.toString(),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/xml',
        },
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to list nodes: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const xml = await response.text();

    // Parse the response - it should contain a ContainerNode with child nodes
    try {
      const containerNode = parseNodeResponse(xml);

      // Return child nodes if available, otherwise empty array
      return containerNode.nodes || [];
    } catch (error) {
      // If parsing as single node fails, try parsing as node list
      console.warn('[VOSpace Client] Failed to parse as container node, trying as node list:', error);
      return parseNodeList(xml);
    }
  }

  /**
   * Creates a folder (ContainerNode)
   *
   * @param path - Path where to create the folder
   * @param title - Optional title/description
   * @param token - Authorization token
   */
  async createFolder(path: string, title: string | undefined, token: string): Promise<void> {
    // Sanitize the path to remove spaces and special characters
    const sanitized = sanitizePath(path);
    const normalizedPath = normalizePath(sanitized);

    const uri = toVOSpaceURI(normalizedPath);
    const endpoint = `${this.baseUrl}/nodes/${normalizedPath}`;

    const xml = generateContainerNode(uri, title);

    const response = await fetchExternalApi(
      endpoint,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml',
        },
        body: xml,
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Handle 409 Conflict gracefully - folder already exists
      if (response.status === 409 && errorText.includes('DuplicateNode')) {
        // Folder already exists, this is not an error
        console.log(`[VOSpace] Folder already exists: ${normalizedPath}`);
        return;
      }

      // For other errors, throw
      throw new Error(
        `Failed to create folder: ${response.status} ${response.statusText}. ${errorText}`
      );
    }
  }

  /**
   * Creates a data node (file metadata) - call before uploading file content
   *
   * @param path - Path where to create the file
   * @param title - Optional title/description
   * @param token - Authorization token
   */
  async createDataNode(path: string, title: string | undefined, token: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    const uri = toVOSpaceURI(normalizedPath);
    const endpoint = `${this.baseUrl}/nodes/${normalizedPath}`;

    const xml = generateDataNode(uri, title);

    const response = await fetchExternalApi(
      endpoint,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml',
        },
        body: xml,
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();

      // Handle 409 Conflict gracefully - file node already exists
      if (response.status === 409 && errorText.includes('DuplicateNode')) {
        // File node already exists, this is not an error
        console.log(`[VOSpace] File node already exists: ${normalizedPath}`);
        return;
      }

      // For other errors, throw
      throw new Error(
        `Failed to create data node: ${response.status} ${response.statusText}. ${errorText}`
      );
    }
  }

  /**
   * Uploads file content to VOSpace
   *
   * @param path - Path of the file to upload to
   * @param content - File content as string or Buffer
   * @param token - Authorization token
   */
  async uploadFile(path: string, content: string | Buffer, token: string): Promise<void> {
    // Sanitize the path to remove spaces and special characters
    const sanitized = sanitizePath(path);
    const normalizedPath = normalizePath(sanitized);

    const uri = toVOSpaceURI(normalizedPath);

    // Step 1: Check if the node exists first to avoid unnecessary 409 errors
    const exists = await this.nodeExists(normalizedPath, token);

    if (!exists) {
      // Only create the data node if it doesn't already exist
      // Note: createDataNode handles 409 Conflict gracefully if node exists
      await this.createDataNode(normalizedPath, undefined, token);
    }

    // Step 2: Get transfer endpoint for upload using synchronous transfer
    const transferEndpoint = await this.getSyncTransferEndpoint(
      uri,
      'pushToVoSpace',
      token
    );

    // Step 3: Upload the content to the transfer URL
    // Convert Buffer to Blob for Web API compatibility
    // Use Uint8Array constructor to ensure type compatibility
    const bodyContent = typeof content === 'string'
      ? content
      : new Blob([new Uint8Array(content)]);

    const uploadResponse = await fetchExternalApi(
      transferEndpoint.url,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: bodyContent,
      },
      this.timeout * 2 // Double timeout for uploads
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Failed to upload file content: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`
      );
    }
  }

  /**
   * Downloads file content from VOSpace
   *
   * @param path - Path of the file to download
   * @param token - Authorization token
   * @returns File content as Buffer
   */
  async downloadFile(path: string, token: string): Promise<Buffer> {
    const normalizedPath = normalizePath(path);
    const uri = toVOSpaceURI(normalizedPath);

    // Get transfer endpoint for download using synchronous transfer
    const transferEndpoint = await this.getSyncTransferEndpoint(
      uri,
      'pullFromVoSpace',
      token
    );

    // Download the content from the transfer URL
    const response = await fetchExternalApi(
      transferEndpoint.url,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      this.timeout * 2 // Double timeout for downloads
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Deletes a node (file or folder)
   *
   * @param path - Path of the node to delete
   * @param token - Authorization token
   */
  async deleteNode(path: string, token: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    const endpoint = `${this.baseUrl}/nodes/${normalizedPath}`;

    const response = await fetchExternalApi(
      endpoint,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete node: ${response.status} ${response.statusText}. ${errorText}`
      );
    }
  }

  /**
   * Updates node properties
   *
   * @param path - Path of the node to update
   * @param properties - Properties to update
   * @param token - Authorization token
   */
  async updateProperties(
    path: string,
    properties: Record<string, string>,
    token: string
  ): Promise<void> {
    const normalizedPath = normalizePath(path);
    const uri = toVOSpaceURI(normalizedPath);
    const endpoint = `${this.baseUrl}/nodes/${normalizedPath}`;

    const xml = generatePropertyUpdate(uri, properties);

    const response = await fetchExternalApi(
      endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml',
        },
        body: xml,
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update properties: ${response.status} ${response.statusText}. ${errorText}`
      );
    }
  }

  /**
   * Gets node metadata
   *
   * @param path - Path of the node to get
   * @param token - Authorization token
   * @returns VONode metadata
   */
  async getNode(path: string, token: string): Promise<VONode> {
    const normalizedPath = normalizePath(path);
    const endpoint = `${this.baseUrl}/nodes/${normalizedPath}`;

    const response = await fetchExternalApi(
      endpoint,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/xml',
        },
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get node: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const xml = await response.text();
    return parseNodeResponse(xml);
  }

  /**
   * Gets a transfer endpoint using synchronous transfer protocol
   * This is simpler and faster than async UWS jobs for small transfers
   *
   * @param uri - VOSpace URI of the target node
   * @param direction - Transfer direction
   * @param token - Authorization token
   * @returns Transfer endpoint URL
   */
  private async getSyncTransferEndpoint(
    uri: string,
    direction: 'pushToVoSpace' | 'pullFromVoSpace',
    token: string
  ): Promise<TransferEndpoint> {
    const protocol = direction === 'pullFromVoSpace'
      ? 'ivo://ivoa.net/vospace/core#httpget'
      : 'ivo://ivoa.net/vospace/core#httpput';

    // Use synctrans endpoint with XML body (POST request)
    const transferXml = generateTransferRequest(uri, direction, protocol);
    const endpoint = `${this.baseUrl}/synctrans`;

    // Use longer timeout for transfer endpoint operations (they can be slow)
    // and implement retry logic with exponential backoff
    const transferTimeout = Math.max(this.timeout * 2, 60000); // At least 60 seconds
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`[VOSpace] Retrying getSyncTransferEndpoint (attempt ${attempt + 1}/${maxRetries + 1}) after ${backoffDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }

        const response = await fetchExternalApi(
          endpoint,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'text/xml',
              Accept: 'text/plain',
            },
            body: transferXml,
          },
          transferTimeout
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to get sync transfer endpoint: ${response.status} ${response.statusText}. ${errorText}`
          );
        }

        // Success - parse and return the endpoint
        const responseText = await response.text();
        const urlMatch = responseText.match(/<vos:endpoint>(.*?)<\/vos:endpoint>/);

        if (!urlMatch || !urlMatch[1]) {
          throw new Error('Transfer endpoint URL not found in response');
        }

        return {
          url: urlMatch[1],
          protocol,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on timeout errors
        if (!lastError.message.includes('timeout') || attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new Error('Failed to get transfer endpoint after retries');
  }

  /**
   * Polls a UWS job until it completes or times out
   *
   * @param jobEndpoint - Job endpoint URL
   * @param token - Authorization token
   * @param maxAttempts - Maximum number of polling attempts (default: 30)
   * @param pollInterval - Interval between polls in milliseconds (default: 500ms)
   * @returns Job XML when completed
   * @throws {Error} If job fails or times out
   */
  private async pollJobCompletion(
    jobEndpoint: string,
    token: string,
    maxAttempts: number = 30,
    pollInterval: number = 500
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const jobResponse = await fetchExternalApi(
        jobEndpoint,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/xml',
          },
        },
        this.timeout
      );

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        throw new Error(
          `Failed to get job details: ${jobResponse.status} ${jobResponse.statusText}. ${errorText}`
        );
      }

      const jobXml = await jobResponse.text();

      // Check job phase
      const phaseMatch = jobXml.match(/<[^:]*:phase[^>]*>([^<]+)<\/[^:]*:phase>/);
      if (phaseMatch && phaseMatch[1]) {
        const phase = phaseMatch[1].trim();

        if (phase === 'COMPLETED') {
          // Job completed successfully
          return jobXml;
        } else if (phase === 'ERROR' || phase === 'ABORTED') {
          // Job failed
          const errorMatch = jobXml.match(/<[^:]*:errorSummary[^>]*>[\s\S]*?<[^:]*:message[^>]*>([^<]+)<\/[^:]*:message>/);
          const errorMessage = errorMatch && errorMatch[1] ? errorMatch[1].trim() : 'Unknown error';
          throw new Error(`Transfer job failed with phase ${phase}: ${errorMessage}`);
        } else if (phase === 'EXECUTING' || phase === 'QUEUED' || phase === 'PENDING') {
          // Job still running, continue polling
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }
        }
      }

      // If we've exhausted attempts
      if (attempt === maxAttempts) {
        throw new Error(`Transfer job timed out after ${maxAttempts} polling attempts`);
      }
    }

    throw new Error('Transfer job polling failed');
  }

  /**
   * Gets a transfer endpoint for upload or download
   *
   * @param uri - VOSpace URI of the target node
   * @param direction - Transfer direction
   * @param token - Authorization token
   * @returns Transfer endpoint URL
   */
  private async getTransferEndpoint(
    uri: string,
    direction: 'pushToVoSpace' | 'pullFromVoSpace',
    token: string
  ): Promise<TransferEndpoint> {
    // Use the async transfer protocol with POST /transfers
    // This creates a transfer job and returns the endpoint
    const protocol = direction === 'pullFromVoSpace'
      ? 'ivo://ivoa.net/vospace/core#httpget'
      : 'ivo://ivoa.net/vospace/core#httpput';

    const transferXml = generateTransferRequest(uri, direction, protocol);
    const endpoint = `${this.baseUrl}/transfers`;

    const response = await fetchExternalApi(
      endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml',
        },
        body: transferXml,
      },
      this.timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get transfer endpoint: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Parse the UWS job response
    const xmlResponse = await response.text();

    // Extract job ID from the response
    const jobIdMatch = xmlResponse.match(/<[^:]*:jobId[^>]*>([^<]+)<\/[^:]*:jobId>/);
    if (!jobIdMatch || !jobIdMatch[1]) {
      throw new Error('Could not extract job ID from transfer response');
    }

    const jobId = jobIdMatch[1].trim();

    // Start the job by setting phase to RUN
    const phaseEndpoint = `${this.baseUrl}/transfers/${jobId}/phase`;
    const phaseResponse = await fetchExternalApi(
      phaseEndpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'PHASE=RUN',
      },
      this.timeout
    );

    if (!phaseResponse.ok) {
      const errorText = await phaseResponse.text();
      throw new Error(
        `Failed to start transfer job: ${phaseResponse.status} ${phaseResponse.statusText}. ${errorText}`
      );
    }

    // Poll the job until it completes and has results
    const jobEndpoint = `${this.baseUrl}/transfers/${jobId}`;
    const jobXml = await this.pollJobCompletion(jobEndpoint, token);

    // Step 1: Check if there's an endpoint directly in the protocol
    const directEndpointMatch = jobXml.match(/<[^:]*:protocol[^>]*>[\s\S]*?<[^:]*:endpoint[^>]*>([^<]+)<\/[^:]*:endpoint>[\s\S]*?<\/[^:]*:protocol>/);
    if (directEndpointMatch && directEndpointMatch[1]) {
      const transferUrl = directEndpointMatch[1].trim();
      return {
        url: transferUrl,
        protocol,
      };
    }

    // Step 2: Get the transferDetails URL and fetch it
    const transferDetailsMatch = jobXml.match(/<[^:]*:result[^>]+id="transferDetails"[^>]+xlink:href="([^"]+)"/);
    if (transferDetailsMatch && transferDetailsMatch[1]) {
      const transferDetailsUrl = transferDetailsMatch[1].trim();

      // Fetch the transfer details to get the actual endpoint
      const detailsResponse = await fetchExternalApi(
        transferDetailsUrl,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/xml',
          },
        },
        this.timeout
      );

      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        throw new Error(
          `Failed to get transfer details: ${detailsResponse.status} ${detailsResponse.statusText}. ${errorText}`
        );
      }

      const detailsXml = await detailsResponse.text();

      // Extract endpoint from transfer details
      const endpointMatch = detailsXml.match(/<[^:]*:endpoint[^>]*>([^<]+)<\/[^:]*:endpoint>/);
      if (endpointMatch && endpointMatch[1]) {
        const transferUrl = endpointMatch[1].trim();
        return {
          url: transferUrl,
          protocol,
        };
      }
    }

    throw new Error('Could not extract transfer endpoint from job details');
  }

  /**
   * Checks if a node exists
   *
   * @param path - Path to check
   * @param token - Authorization token
   * @returns True if node exists, false if not found
   * @throws {Error} Network errors, auth errors, or other non-404 errors
   */
  async nodeExists(path: string, token: string): Promise<boolean> {
    try {
      await this.getNode(path, token);
      return true;
    } catch (error) {
      // Only return false for 404 (not found), re-throw other errors
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      // Re-throw network errors, auth errors, etc.
      throw error;
    }
  }
}

/**
 * Creates a VOSpace client instance
 *
 * @param baseUrl - VOSpace base URL
 * @param timeout - Optional timeout in milliseconds
 * @returns VOSpaceClient instance
 */
export function createVOSpaceClient(baseUrl: string, timeout?: number): VOSpaceClient {
  return new VOSpaceClient({ baseUrl, timeout });
}
