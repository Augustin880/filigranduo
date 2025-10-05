fetch('data/performances.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('performance-list');
    data.forEach(performance => {
      const div = document.createElement('div');
      div.className = "performance-item";
      div.innerHTML = `
        <a href="${performance.link}" target="_blank">
          <h3>${performance.title}</h3>
          <p>${performance.date}</p>
        </a>
      `;
      container.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Error loading performances:', error);
  });
