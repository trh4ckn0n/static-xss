document.getElementById('startBtn').addEventListener('click', async () => {
  const targetsFile = document.getElementById('targetsFile').files[0];
  const payloadsFile = document.getElementById('payloadsFile').files[0];
  const output = document.getElementById('output');
  output.textContent = '';

  if (!targetsFile) {
    output.textContent = 'Veuillez charger un fichier de cibles JSON.';
    return;
  }

  const targetsText = await targetsFile.text();
  let targets;
  try {
    targets = JSON.parse(targetsText);
  } catch (e) {
    output.textContent = 'Le fichier de cibles n\'est pas un JSON valide.';
    return;
  }

  let payloads = [];
  if (payloadsFile) {
    const payloadsText = await payloadsFile.text();
    payloads = payloadsText.split('\n').filter(line => line.trim() !== '');
  } else {
    const defaultPayloadsText = await fetch('default_wordlist.txt').then(res => res.text());
    payloads = defaultPayloadsText.split('\n').filter(line => line.trim() !== '');
  }

  for (const [url, params] of Object.entries(targets)) {
    for (const [param, values] of Object.entries(params)) {
      for (const payload of payloads) {
        const testUrl = new URL(url);
        testUrl.searchParams.set(param, payload);
        try {
          const response = await fetch(testUrl.toString(), { method: 'GET', mode: 'no-cors' });
          output.textContent += `Testé : ${testUrl.toString()}\n`;
        } catch (e) {
          output.textContent += `Erreur lors du test de : ${testUrl.toString()}\n`;
        }
      }
    }
  }

  output.textContent += 'Tests terminés.';
});
