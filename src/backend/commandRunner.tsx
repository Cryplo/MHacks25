const { exec } = require('child_process');

/* Returns [boolean, string, string], corresponding to [error, stdout, stderr]*/
export function RunCommand(command: string): [boolean, string, string]{
    let output: [boolean, string, string];
    exec(command, (error: string, stdout:string, stderr:string) => {
        output = [error == "", stdout, stderr];    
    });
    return output;
}