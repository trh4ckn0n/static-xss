document.getElementById('startTest').addEventListener('click', async () => {
  const wordlistFile = document.getElementById('wordlist').files[0];
  let payloads = [];

  if (wordlistFile) {
    payloads = await readWordlist(wordlistFile);
  } else {
    payloads = await fetchDefaultWordlist();
  }

  const targets = await fetchTargets();
  const results = [];

  for (const [url, params] of Object.entries(targets)) {
    for (const param in params) {
      for (const payload of payloads) {
        const testUrl = injectPayload(url, param, payload);
        try {
          const response = await fetch(testUrl);
          const text = await response.text();
          const vulnerable = analyzeResponse(text, payload);
          results.push({
            url: testUrl,
            payload,
            vulnerable
          });
          displayResult(testUrl, payload, vulnerable);
        } catch (error) {
          console.error(`Erreur lors de la requête vers ${testUrl}:`, error);
        }
      }
    }
  }

  generateReport(results);
});

async function readWordlist(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split('\n').map(line => line.trim()).filter(line => line);
      resolve(lines);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function fetchDefaultWordlist() {
  const response = await fetch('default_wordlist.txt');
  const text = await response.text();
  return text.split('\n').map(line => line.trim()).filter(line => line);
}

async function fetchTargets() {
  const response = await fetch('targets.json');
  return await response.json();
}

function injectPayload(url, param, payload) {
  const urlObj = new URL(url);
  urlObj.searchParams.set(param, payload);
  return urlObj.toString();
}

function analyzeResponse(responseText, payload) {
  // Simple check: does the payload appear in the response?
  return responseText.includes(payload);
}

function displayResult(url, payload, vulnerable) {
  const resultsDiv = document.getElementById('results');
  const status = vulnerable ? 'VULNÉRABLE' : 'Sain';
  resultsDiv.innerText += `[${status}] ${url} | Payload: ${payload}\n`;
}

function generateReport(results) {
  const csvContent = 'data:text/csv;charset=utf-8,URL,Payload,Vulnerable\n' +
    results.map(r => `${r.url},${r.payload},${r.vulnerable}`).join('\n');
  const encodedUri = encodeURI(csvContent);
  const downloadButton = document.getElementById('downloadReport');
  downloadButton.style.display = 'inline-block';
  downloadButton.onclick = () => {
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'xss_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
}
