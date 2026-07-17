const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const npmPath = path.join(__dirname, '..', 'node_modules', '.bin', 'npm');

console.log('Installing backend deps in:', backendDir);

try {
  const result = execSync('npm install', {
    cwd: backendDir,
    env: {
      ...process.env,
      PATH: `C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.12.0;${process.env.PATH}`
    },
    stdio: 'inherit',
    shell: 'cmd.exe'
  });
  console.log('Install complete');
} catch (err) {
  console.error('Install failed:', err.message);
}
