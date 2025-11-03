/**
 * VOSpace XML Handler
 *
 * Handles XML parsing and generation for VOSpace API interactions.
 * VOSpace uses XML format for node metadata and operations.
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * TypeScript interfaces for XML parser output
 */
interface ParsedXMLProperty {
  '@_uri': string;
  '@_readOnly'?: string;
  '#text'?: string;
}

interface ParsedXMLNode {
  '@_uri': string;
  '@_type'?: string;
  properties?: {
    property: ParsedXMLProperty | ParsedXMLProperty[];
  };
  nodes?: {
    node: ParsedXMLNode | ParsedXMLNode[];
  };
  target?: string | { '#text': string };
}

/**
 * VOSpace XML namespace constants
 */
const VOS_NS = 'http://www.ivoa.net/xml/VOSpace/v2.0';
const XSI_NS = 'http://www.w3.org/2001/XMLSchema-instance';

/**
 * Configure XML parser for VOSpace responses
 */
const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  removeNSPrefix: true, // Remove namespace prefixes (vos:, xsi:) for easier access
  isArray: (name: string, jpath: string) => {
    // Only make 'property' always an array. Handle 'node' manually since root node should be object
    return name === 'property';
  },
};

/**
 * VOSpace node types
 */
export enum VONodeType {
  ContainerNode = 'vos:ContainerNode',
  DataNode = 'vos:DataNode',
  LinkNode = 'vos:LinkNode',
  UnstructuredDataNode = 'vos:UnstructuredDataNode',
  StructuredDataNode = 'vos:StructuredDataNode',
}

/**
 * VOSpace node interface
 */
export interface VONode {
  uri: string;
  type: VONodeType;
  name: string;
  size?: number;
  created?: string;
  modified?: string;
  properties?: Record<string, string>;
  nodes?: VONode[];
  isPublic?: boolean;
  target?: string; // For LinkNodes
}

/**
 * VOSpace property interface
 */
export interface VOProperty {
  uri: string;
  value: string;
  readOnly?: boolean;
}

/**
 * Parses a single VOSpace node from XML response
 *
 * @param xml - The XML string to parse
 * @returns Parsed VONode
 */
export function parseNodeResponse(xml: string): VONode {
  const parser = new XMLParser(xmlParserOptions);

  try {
    const result = parser.parse(xml);

    // The root element is 'node' (namespace prefix removed)
    if (!result.node) {
      throw new Error('No node element found in XML response');
    }

    return parseNodeObject(result.node);
  } catch (error) {
    console.error('[VOSpace Parser] Parse error:', error);
    throw new Error(`XML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses a list of VOSpace nodes from XML response
 *
 * @param xml - The XML string to parse
 * @returns Array of parsed VONodes
 */
export function parseNodeList(xml: string): VONode[] {
  const parser = new XMLParser(xmlParserOptions);

  try {
    const result = parser.parse(xml);

    // The root element is 'node' (namespace prefix removed)
    if (!result.node) {
      throw new Error('No node element found in XML response');
    }

    const rootNode = result.node;
    const nodes: VONode[] = [];

    // Check if the root node has a 'nodes' container with child nodes
    if (rootNode.nodes && rootNode.nodes.node) {
      const childNodes = Array.isArray(rootNode.nodes.node)
        ? rootNode.nodes.node
        : [rootNode.nodes.node];

      childNodes.forEach((nodeObj: ParsedXMLNode, index: number) => {
        try {
          const node = parseNodeObject(nodeObj);
          nodes.push(node);
        } catch (error) {
          console.warn(`Failed to parse node at index ${index}:`, error);
        }
      });
    }

    return nodes;
  } catch (error) {
    console.error('[VOSpace Parser] Parse error:', error);
    throw new Error(`XML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses a single node object from fast-xml-parser output
 *
 * @param nodeObj - The parsed node object from fast-xml-parser
 * @returns Parsed VONode
 */
function parseNodeObject(nodeObj: ParsedXMLNode): VONode {
  if (!nodeObj) {
    throw new Error('Node object is null or undefined');
  }

  // Get node attributes (with @_ prefix from fast-xml-parser)
  const uri = nodeObj['@_uri'];
  const typeAttr = nodeObj['@_type'] || 'vos:Node';

  if (!uri) {
    console.error('[VOSpace Parser] Node object missing uri attribute!', nodeObj);
    throw new Error('Node object missing uri attribute');
  }

  // Determine node type
  let type: VONodeType = VONodeType.DataNode;
  if (typeAttr.includes('ContainerNode')) {
    type = VONodeType.ContainerNode;
  } else if (typeAttr.includes('LinkNode')) {
    type = VONodeType.LinkNode;
  } else if (typeAttr.includes('UnstructuredDataNode')) {
    type = VONodeType.UnstructuredDataNode;
  } else if (typeAttr.includes('StructuredDataNode')) {
    type = VONodeType.StructuredDataNode;
  }

  // Extract name from URI
  const uriParts = uri.split('/');
  const name = uriParts[uriParts.length - 1] || '';

  // Parse properties
  const properties: Record<string, string> = {};
  if (nodeObj.properties && nodeObj.properties.property) {
    const propertyArray = Array.isArray(nodeObj.properties.property)
      ? nodeObj.properties.property
      : [nodeObj.properties.property];

    propertyArray.forEach((prop: ParsedXMLProperty) => {
      const propUri = prop['@_uri'] || '';
      const propValue = prop['#text'] || '';

      // Extract property name from URI (last part after # or /)
      const propName = propUri.split('#').pop() || propUri.split('/').pop() || propUri;

      if (propName) {
        properties[propName] = propValue;
      }
    });
  }

  // Parse size from properties
  let size: number | undefined;
  if (properties.length) {
    const sizeValue = parseInt(properties.length, 10);
    if (!isNaN(sizeValue)) {
      size = sizeValue;
    }
  }

  // Parse timestamps
  const created = properties.date || undefined;
  const modified = properties.lastmod || properties.modified || undefined;

  // Check if public
  const isPublic = properties.ispublic === 'true' || properties.isPublic === 'true';

  // Parse child nodes for containers
  const childNodes: VONode[] = [];
  if (type === VONodeType.ContainerNode && nodeObj.nodes && nodeObj.nodes.node) {
    const childNodeArray = Array.isArray(nodeObj.nodes.node)
      ? nodeObj.nodes.node
      : [nodeObj.nodes.node];

    childNodeArray.forEach((child: ParsedXMLNode, index: number) => {
      try {
        childNodes.push(parseNodeObject(child));
      } catch (error) {
        console.warn(`[VOSpace Parser] Failed to parse child node at index ${index}:`, error);
      }
    });
  }

  // Parse target for link nodes
  const target = nodeObj.target
    ? typeof nodeObj.target === 'string'
      ? nodeObj.target
      : nodeObj.target['#text']
    : undefined;

  return {
    uri,
    type,
    name,
    size,
    created,
    modified,
    properties,
    nodes: childNodes.length > 0 ? childNodes : undefined,
    isPublic,
    target,
  };
}

/**
 * Generates XML for creating a ContainerNode (directory)
 *
 * @param uri - The VOSpace URI for the new container
 * @param title - Optional title/description for the container
 * @returns XML string
 */
export function generateContainerNode(uri: string, title?: string): string {
  const propertiesXml = title
    ? `<vos:properties>
    <vos:property uri="urn:vospace:property#title">${escapeXml(title)}</vos:property>
  </vos:properties>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          uri="${escapeXml(uri)}"
          xsi:type="vos:ContainerNode">
  ${propertiesXml}
  <vos:nodes />
</vos:node>`;
}

/**
 * Generates XML for creating a DataNode (file)
 *
 * @param uri - The VOSpace URI for the new data node
 * @param title - Optional title/description for the file
 * @returns XML string
 */
export function generateDataNode(uri: string, title?: string): string {
  const propertiesXml = title
    ? `<vos:properties>
    <vos:property uri="urn:vospace:property#title">${escapeXml(title)}</vos:property>
  </vos:properties>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          uri="${escapeXml(uri)}"
          xsi:type="vos:DataNode">
  ${propertiesXml}
  <vos:accepts />
  <vos:provides />
</vos:node>`;
}

/**
 * Generates XML for updating node properties
 *
 * @param uri - The VOSpace URI of the node to update
 * @param properties - Properties to update
 * @returns XML string
 */
export function generatePropertyUpdate(uri: string, properties: Record<string, string>): string {
  const propertyElements = Object.entries(properties)
    .map(([key, value]) => {
      // Convert property key to URI format if not already
      const propUri = key.startsWith('urn:') || key.startsWith('ivo:')
        ? key
        : `urn:vospace:property#${key}`;

      return `    <vos:property uri="${escapeXml(propUri)}">${escapeXml(value)}</vos:property>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          uri="${escapeXml(uri)}">
  <vos:properties>
${propertyElements}
  </vos:properties>
</vos:node>`;
}

/**
 * Generates XML for a transfer request (upload/download)
 *
 * @param target - The VOSpace URI of the target node
 * @param direction - Transfer direction (pushToVoSpace or pullFromVoSpace)
 * @param protocol - Protocol URI (e.g., ivo://ivoa.net/vospace/core#httpget)
 * @returns XML string
 */
export function generateTransferRequest(
  target: string,
  direction: 'pushToVoSpace' | 'pullFromVoSpace',
  protocol: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:transfer xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <vos:target>${escapeXml(target)}</vos:target>
  <vos:direction>${direction}</vos:direction>
  <vos:protocol uri="${escapeXml(protocol)}" />
</vos:transfer>`;
}

/**
 * Escapes XML special characters and validates input
 *
 * @param text - Text to escape
 * @returns Escaped text
 * @throws {Error} If input contains invalid characters
 */
function escapeXml(text: string): string {
  if (typeof text !== 'string') {
    throw new Error('escapeXml expects a string input');
  }

  // Reject null bytes and control characters that could break XML
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)) {
    throw new Error('Invalid characters in XML content');
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

