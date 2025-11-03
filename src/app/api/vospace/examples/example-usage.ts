/**
 * VOSpace API Example Usage
 *
 * This file demonstrates how to use the VOSpace API (Arc service) from TypeScript code.
 * These examples can be used in Next.js server components, API routes, or server actions.
 */

import { createVOSpaceClient } from '../lib/vospace-client';
import { VONode, VONodeType } from '../lib/vospace-xml';
import {
  normalizePath,
  getParentPath,
  getNodeName,
  joinPath,
} from '../lib/vospace-utils';

/**
 * Example 1: List directory contents
 */
export async function exampleListDirectory(
  baseUrl: string,
  path: string,
  token: string
): Promise<VONode[]> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    const nodes = await client.listNodes(path, token);

    console.log(`Found ${nodes.length} items in ${path}:`);
    nodes.forEach((node) => {
      const nodeType = node.type === VONodeType.ContainerNode ? '📁' : '📄';
      console.log(`  ${nodeType} ${node.name} (${node.size || 0} bytes)`);
    });

    return nodes;
  } catch (error) {
    console.error('Failed to list directory:', error);
    throw error;
  }
}

/**
 * Example 2: Create folder structure
 */
export async function exampleCreateFolderStructure(
  baseUrl: string,
  basePath: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  const folders = [
    joinPath(basePath, 'data'),
    joinPath(basePath, 'scripts'),
    joinPath(basePath, 'results'),
    joinPath(basePath, 'data', 'raw'),
    joinPath(basePath, 'data', 'processed'),
  ];

  for (const folder of folders) {
    try {
      await client.createFolder(folder, getNodeName(folder), token);
      console.log(`Created folder: ${folder}`);
    } catch (error) {
      console.error(`Failed to create folder ${folder}:`, error);
    }
  }
}

/**
 * Example 3: Upload Python script
 */
export async function exampleUploadPythonScript(
  baseUrl: string,
  path: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  const pythonScript = `#!/usr/bin/env python
"""Hello World from VOSpace"""

def main():
    print("Hello from VOSpace!")
    print("This file was uploaded through the Science Portal")

if __name__ == "__main__":
    main()
`;

  try {
    await client.uploadFile(path, pythonScript, token);
    console.log(`Uploaded Python script to: ${path}`);
  } catch (error) {
    console.error('Failed to upload script:', error);
    throw error;
  }
}

/**
 * Example 4: Upload JSON data
 */
export async function exampleUploadJsonData(
  baseUrl: string,
  path: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  const data = {
    experiment: 'test-001',
    timestamp: new Date().toISOString(),
    measurements: [
      { id: 1, value: 42.1, unit: 'celsius' },
      { id: 2, value: 43.7, unit: 'celsius' },
      { id: 3, value: 41.9, unit: 'celsius' },
    ],
    metadata: {
      instrument: 'thermometer-v2',
      location: 'lab-a',
      operator: 'user1',
    },
  };

  const jsonContent = JSON.stringify(data, null, 2);

  try {
    await client.uploadFile(path, jsonContent, token);
    console.log(`Uploaded JSON data to: ${path}`);
  } catch (error) {
    console.error('Failed to upload JSON:', error);
    throw error;
  }
}

/**
 * Example 5: Download and parse JSON file
 */
export async function exampleDownloadAndParseJson<T>(
  baseUrl: string,
  path: string,
  token: string
): Promise<T> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    const content = await client.downloadFile(path, token);
    const jsonString = content.toString('utf8');
    const data = JSON.parse(jsonString) as T;

    console.log(`Downloaded and parsed JSON from: ${path}`);
    return data;
  } catch (error) {
    console.error('Failed to download/parse JSON:', error);
    throw error;
  }
}

/**
 * Example 6: Copy file within VOSpace
 */
export async function exampleCopyFile(
  baseUrl: string,
  sourcePath: string,
  destPath: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    // Download source file
    const content = await client.downloadFile(sourcePath, token);

    // Upload to destination
    await client.uploadFile(destPath, content, token);

    console.log(`Copied file from ${sourcePath} to ${destPath}`);
  } catch (error) {
    console.error('Failed to copy file:', error);
    throw error;
  }
}

/**
 * Example 7: Move file within VOSpace
 */
export async function exampleMoveFile(
  baseUrl: string,
  sourcePath: string,
  destPath: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    // Download source file
    const content = await client.downloadFile(sourcePath, token);

    // Upload to destination
    await client.uploadFile(destPath, content, token);

    // Delete source
    await client.deleteNode(sourcePath, token);

    console.log(`Moved file from ${sourcePath} to ${destPath}`);
  } catch (error) {
    console.error('Failed to move file:', error);
    throw error;
  }
}

/**
 * Example 8: Update file metadata
 */
export async function exampleUpdateMetadata(
  baseUrl: string,
  path: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  const properties = {
    title: 'Updated Title',
    description: 'This file was updated via API',
    lastmod: new Date().toISOString(),
    version: '2.0',
  };

  try {
    await client.updateProperties(path, properties, token);
    console.log(`Updated metadata for: ${path}`);
  } catch (error) {
    console.error('Failed to update metadata:', error);
    throw error;
  }
}

/**
 * Example 9: Check if file exists before uploading
 */
export async function exampleSafeUpload(
  baseUrl: string,
  path: string,
  content: string | Buffer,
  token: string,
  overwrite: boolean = false
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    const exists = await client.nodeExists(path, token);

    if (exists && !overwrite) {
      throw new Error(`File already exists: ${path}. Set overwrite=true to replace.`);
    }

    await client.uploadFile(path, content, token);
    console.log(`Uploaded file to: ${path}`);
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
}

/**
 * Example 10: Batch upload files
 */
export async function exampleBatchUpload(
  baseUrl: string,
  files: Array<{ path: string; content: string | Buffer }>,
  token: string
): Promise<{ success: number; failed: number }> {
  const client = createVOSpaceClient(baseUrl, 30000);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    try {
      await client.uploadFile(file.path, file.content, token);
      console.log(`✓ Uploaded: ${file.path}`);
      success++;
    } catch (error) {
      console.error(`✗ Failed to upload ${file.path}:`, error);
      failed++;
    }
  }

  console.log(`Batch upload complete: ${success} succeeded, ${failed} failed`);
  return { success, failed };
}

/**
 * Example 11: Recursive directory listing
 */
export async function exampleRecursiveList(
  baseUrl: string,
  path: string,
  token: string,
  depth: number = 0,
  maxDepth: number = 3
): Promise<VONode[]> {
  const client = createVOSpaceClient(baseUrl, 30000);

  if (depth > maxDepth) {
    return [];
  }

  try {
    const nodes = await client.listNodes(path, token);
    const allNodes: VONode[] = [...nodes];

    // Recursively list subdirectories
    for (const node of nodes) {
      if (node.type === VONodeType.ContainerNode) {
        const childPath = joinPath(path, node.name);
        const childNodes = await exampleRecursiveList(
          baseUrl,
          childPath,
          token,
          depth + 1,
          maxDepth
        );
        allNodes.push(...childNodes);
      }
    }

    return allNodes;
  } catch (error) {
    console.error(`Failed to list directory ${path}:`, error);
    return [];
  }
}

/**
 * Example 12: Calculate total directory size
 */
export async function exampleCalculateDirectorySize(
  baseUrl: string,
  path: string,
  token: string
): Promise<number> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    const nodes = await client.listNodes(path, token);
    let totalSize = 0;

    for (const node of nodes) {
      if (node.type === VONodeType.ContainerNode) {
        // Recursively calculate subdirectory size
        const childPath = joinPath(path, node.name);
        totalSize += await exampleCalculateDirectorySize(baseUrl, childPath, token);
      } else {
        totalSize += node.size || 0;
      }
    }

    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`Total size of ${path}: ${sizeMB} MB`);
    return totalSize;
  } catch (error) {
    console.error(`Failed to calculate directory size:`, error);
    return 0;
  }
}

/**
 * Example 13: Search for files by name pattern
 */
export async function exampleSearchFiles(
  baseUrl: string,
  basePath: string,
  pattern: RegExp,
  token: string
): Promise<VONode[]> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    const allNodes = await exampleRecursiveList(baseUrl, basePath, token);
    const matchingNodes = allNodes.filter((node) => pattern.test(node.name));

    console.log(`Found ${matchingNodes.length} files matching pattern: ${pattern}`);
    matchingNodes.forEach((node) => {
      console.log(`  - ${node.name} (${node.uri})`);
    });

    return matchingNodes;
  } catch (error) {
    console.error('Failed to search files:', error);
    return [];
  }
}

/**
 * Example 14: Cleanup old files
 */
export async function exampleCleanupOldFiles(
  baseUrl: string,
  path: string,
  olderThanDays: number,
  token: string
): Promise<number> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    const nodes = await client.listNodes(path, token);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;

    for (const node of nodes) {
      if (node.modified) {
        const modifiedDate = new Date(node.modified);
        if (modifiedDate < cutoffDate) {
          const nodePath = joinPath(path, node.name);
          await client.deleteNode(nodePath, token);
          console.log(`Deleted old file: ${node.name}`);
          deletedCount++;
        }
      }
    }

    console.log(`Cleanup complete: deleted ${deletedCount} old files`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old files:', error);
    return 0;
  }
}

/**
 * Example 15: Complete workflow - Process and store data
 */
export async function exampleCompleteWorkflow(
  baseUrl: string,
  basePath: string,
  token: string
): Promise<void> {
  const client = createVOSpaceClient(baseUrl, 30000);

  try {
    // 1. Create folder structure
    console.log('Step 1: Creating folder structure...');
    const folders = ['raw', 'processed', 'results'];
    for (const folder of folders) {
      await client.createFolder(joinPath(basePath, folder), folder, token);
    }

    // 2. Upload raw data
    console.log('Step 2: Uploading raw data...');
    const rawData = {
      timestamp: new Date().toISOString(),
      sensor_readings: [23.5, 24.1, 23.8, 24.3],
    };
    await client.uploadFile(
      joinPath(basePath, 'raw', 'data.json'),
      JSON.stringify(rawData, null, 2),
      token
    );

    // 3. Process data (example: calculate average)
    console.log('Step 3: Processing data...');
    const content = await client.downloadFile(joinPath(basePath, 'raw', 'data.json'), token);
    const data = JSON.parse(content.toString('utf8'));
    const average =
      data.sensor_readings.reduce((a: number, b: number) => a + b, 0) /
      data.sensor_readings.length;

    // 4. Upload processed data
    console.log('Step 4: Uploading processed data...');
    const processedData = {
      original_timestamp: data.timestamp,
      processed_timestamp: new Date().toISOString(),
      average_reading: average,
      num_readings: data.sensor_readings.length,
    };
    await client.uploadFile(
      joinPath(basePath, 'processed', 'analysis.json'),
      JSON.stringify(processedData, null, 2),
      token
    );

    // 5. Generate report
    console.log('Step 5: Generating report...');
    const report = `Analysis Report
==============

Original Data:
- Timestamp: ${data.timestamp}
- Readings: ${data.sensor_readings.join(', ')}

Processed Results:
- Average: ${average.toFixed(2)}
- Count: ${data.sensor_readings.length}
- Processed: ${processedData.processed_timestamp}
`;

    await client.uploadFile(joinPath(basePath, 'results', 'report.txt'), report, token);

    console.log('Workflow complete! Results stored in VOSpace.');
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}
