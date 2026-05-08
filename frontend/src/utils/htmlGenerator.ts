export const generateFullHtmlDocument = (htmlContent: string, isPdfClone: boolean = false): string => {
  const academicCss = isPdfClone ? `
    body { margin: 0; padding: 0; background: #e2e8f0; display: flex; flex-direction: column; align-items: center; overflow-x: hidden; }
    .pdf-visual-clone { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 2rem 0; }
    .pdf-page-svg { background: white; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); margin-bottom: 2rem; width: 75% !important; max-width: 850px !important; min-width: 300px; display: block; overflow: hidden; margin-left: auto; margin-right: auto; }
    .pdf-page-svg svg, .pdf-page-svg img { width: 100%; height: auto; display: block; }
  ` : `
    body {
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      color: #2b2b2b;
      max-width: 850px;
      margin: 0 auto;
      padding: 3rem 4rem;
      background: white;
    }
    h1.article-title {
      font-size: 2.2em;
      margin-bottom: 0.8em;
      font-weight: 700;
      color: #005A9C;
      line-height: 1.2;
      border-bottom: 2px solid #eaeaea;
      padding-bottom: 10px;
    }
    h2 {
      font-size: 1.4em;
      margin-top: 2em;
      color: #2c3e50;
      font-weight: bold;
    }
    h3 {
      font-size: 1.1em;
      margin-top: 1.5em;
      color: #444;
      font-weight: bold;
    }
    p {
      text-align: justify;
      margin-bottom: 1.2em;
      font-size: 1.05em;
    }
    blockquote {
      margin: 2em 0;
      padding: 1em 1.5em;
      background: #f8f9fa;
      border-left: 4px solid #005A9C;
      font-style: italic;
      color: #555;
    }
    ul, ol {
      margin-bottom: 1.2em;
      padding-left: 2em;
    }
    li {
      margin-bottom: 0.5em;
    }
    a {
      color: #005A9C;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 2em 0;
      font-size: 0.95em;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px 15px;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }
  `;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artículo Científico</title>
  <style>${academicCss}</style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
};
