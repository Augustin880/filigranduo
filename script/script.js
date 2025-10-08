fetch('data/performances.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('performance-list');
    data.performances.forEach(performance => {
      const div = document.createElement('div');
      div.className = "performance-item";
      div.innerHTML = `
        <a href="${performance.link}" target="_blank">
          <h2>${performance.date}</h2>
          <h3>${performance.title}</h3>
        </a>
      `;
      container.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Error loading performances:', error);
  });
