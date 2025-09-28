const runShellCommand = async (command) => {
  try {
    const response = await fetch('http://localhost:8000/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command })
    });

    const data = await response.json();
    console.log('Command output:', data);
  } catch (err) {
    console.error('Failed to run command:', err);
  }
};

// Example usage:
runShellCommand('echo Hello from shell');
