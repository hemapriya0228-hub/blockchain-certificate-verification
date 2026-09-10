async function check() {
  const html = await fetch('http://localhost:4173/').then((r) => r.text());
  const jsMatch = html.match(/\/assets\/[^"']+\.js/);
  const cssMatch = html.match(/\/assets\/[^"']+\.css/);

  console.log('JS Bundle match:', jsMatch ? jsMatch[0] : 'None');
  console.log('CSS Bundle match:', cssMatch ? cssMatch[0] : 'None');

  if (jsMatch) {
    const rJs = await fetch(`http://localhost:4173${jsMatch[0]}`);
    console.log('JS HTTP Status:', rJs.status, 'Length:', rJs.headers.get('content-length'));
  }
  if (cssMatch) {
    const rCss = await fetch(`http://localhost:4173${cssMatch[0]}`);
    console.log('CSS HTTP Status:', rCss.status, 'Length:', rCss.headers.get('content-length'));
  }
}
check().catch(console.error);
