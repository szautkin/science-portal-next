/**
 * Test script for VOSpace XML parser
 *
 * This tests the parser with actual CANFAR XML response format
 */

// Sample XML response from CANFAR VOSpace
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          uri="vos://cadc.nrc.ca~arc/home/szautkin"
          xsi:type="vos:ContainerNode">
  <vos:properties>
    <vos:property uri="ivo://cadc.nrc.ca/vospace/core#inheritPermissions">false</vos:property>
    <vos:property uri="ivo://ivoa.net/vospace/core#creator" readOnly="true">szautkin</vos:property>
    <vos:property uri="ivo://ivoa.net/vospace/core#date" readOnly="true">2025-10-29T17:44:57.853</vos:property>
    <vos:property uri="ivo://ivoa.net/vospace/core#length" readOnly="true">49335707583</vos:property>
  </vos:properties>
  <vos:nodes>
    <vos:node uri="vos://cadc.nrc.ca~arc/home/szautkin/.npm" xsi:type="vos:ContainerNode">
      <vos:properties>
        <vos:property uri="ivo://ivoa.net/vospace/core#creator" readOnly="true">szautkin</vos:property>
        <vos:property uri="ivo://ivoa.net/vospace/core#date" readOnly="true">2025-10-30T12:00:00.000</vos:property>
      </vos:properties>
      <vos:nodes />
    </vos:node>
    <vos:node uri="vos://cadc.nrc.ca~arc/home/szautkin/Untitled3.ipynb" xsi:type="vos:DataNode" busy="false">
      <vos:properties>
        <vos:property uri="ivo://ivoa.net/vospace/core#creator" readOnly="true">szautkin</vos:property>
        <vos:property uri="ivo://ivoa.net/vospace/core#date" readOnly="true">2025-10-31T15:30:00.000</vos:property>
        <vos:property uri="ivo://ivoa.net/vospace/core#length" readOnly="true">1024</vos:property>
      </vos:properties>
      <vos:accepts />
      <vos:provides />
    </vos:node>
  </vos:nodes>
</vos:node>`;

// Test using fast-xml-parser
const { XMLParser } = require('fast-xml-parser');

console.log('Testing VOSpace XML Parser with fast-xml-parser\n');
console.log('=========================\n');

const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  removeNSPrefix: true,
  isArray: (name, jpath) => {
    // Only make 'property' always an array. Handle 'node' manually
    return name === 'property';
  },
};

const parser = new XMLParser(xmlParserOptions);
const result = parser.parse(sampleXML);

console.log('Full parsed result:');
console.log(JSON.stringify(result, null, 2));

console.log('\n--- Checking structure ---\n');
console.log('Has node?', !!result.node);
console.log('Node URI:', result.node?.['@_uri']);
console.log('Node type:', result.node?.['@_type']);
console.log('Has properties?', !!result.node?.properties);
console.log('Has nodes container?', !!result.node?.nodes);
console.log('Has child nodes?', !!result.node?.nodes?.node);

if (result.node?.properties?.property) {
  const props = Array.isArray(result.node.properties.property)
    ? result.node.properties.property
    : [result.node.properties.property];
  console.log('\nRoot node properties:');
  props.forEach((prop, i) => {
    const propUri = prop['@_uri'] || '';
    const propValue = prop['#text'] || '';
    const propName = propUri.split('#').pop() || propUri.split('/').pop() || propUri;
    console.log(`  ${i + 1}. ${propName} = ${propValue}`);
  });
}

if (result.node?.nodes?.node) {
  const childNodes = Array.isArray(result.node.nodes.node)
    ? result.node.nodes.node
    : [result.node.nodes.node];

  console.log('\n--- Child nodes ---\n');
  console.log('Number of child nodes:', childNodes.length);

  childNodes.forEach((node, i) => {
    const uri = node['@_uri'] || '';
    const type = node['@_type'] || '';
    const name = uri.split('/').pop();

    console.log(`\nChild node ${i + 1}:`);
    console.log(`  URI: ${uri}`);
    console.log(`  Name: ${name}`);
    console.log(`  Type: ${type}`);

    if (node.properties?.property) {
      const childProps = Array.isArray(node.properties.property)
        ? node.properties.property
        : [node.properties.property];
      console.log(`  Properties: ${childProps.length}`);
      childProps.forEach(prop => {
        const propUri = prop['@_uri'] || '';
        const propValue = prop['#text'] || '';
        const propName = propUri.split('#').pop() || propUri;
        console.log(`    - ${propName}: ${propValue}`);
      });
    }
  });
}

console.log('\n=========================');
console.log('Test completed successfully!');
