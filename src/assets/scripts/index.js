document
  .getElementById('form')
  .addEventListener('submit', async event => {
    event.preventDefault();
    const { value } = document.getElementById('url');
    const { shortUrl } = await postData(value);;
    const resultLink = document.getElementById('result-link');
    resultLink.setAttribute('href', shortUrl);
    resultLink.innerHTML = shortUrl.replace(/^https?:\/\//, '');
    const resultContainer = document.getElementById('result-container');
    resultContainer.classList.remove('invisible');
  });

async function postData(url) {
  const response = await fetch(`https://localhost:3000/new?url=${url}`, {
    method: 'POST',
    mode: 'same-origin',
    cache: 'no-cache',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
  });

  return await response.json();
}
