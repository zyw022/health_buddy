// Silent launcher — spawns `npm run dev` detached with no console window.
// Run with:  node launch.js   (or via launch-silent.vbs which hides even this)
const { spawn } = require('child_process')
const path = require('path')

const cwd = __dirname

const child = spawn(
  'npm.cmd',          // npm on Windows is npm.cmd
  ['run', 'dev'],
  {
    cwd,
    detached: true,   // let child outlive this launcher process
    stdio:    'ignore',
    windowsHide: true, // <-- suppress any console window for the child
    env: {
      ...process.env,
      // ensure nodejs bin directory is on PATH
      PATH: [
        process.env['ProgramFiles']        && require('path').join(process.env['ProgramFiles'],        'nodejs'),
        process.env['ProgramFiles(x86)']   && require('path').join(process.env['ProgramFiles(x86)'],   'nodejs'),
        process.env['APPDATA']             && require('path').join(process.env['APPDATA'],              'npm'),
        process.env.PATH,
      ].filter(Boolean).join(';'),
    },
  }
)

child.unref()   // don't keep this launcher alive waiting for child
process.exit(0) // launcher exits immediately; Electron keeps running
