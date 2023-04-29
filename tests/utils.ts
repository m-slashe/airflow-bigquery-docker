const Docker = require("dockerode");

const docker = new Docker();

function waitForService(serviceName: string) {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      docker.getContainer(serviceName).inspect((err: Error, data: any) => {
        if (err) {
          reject(err);
        }
        if (data?.State?.Health?.Status === "healthy") {
          clearInterval(intervalId);
          resolve(true);
        }
      });
    }, 5000);
  });
}

function executeCommand(
  containerName: string,
  command: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const container = docker.getContainer(containerName);

    container.exec(
      {
        Cmd: command.split(" "),
        AttachStdout: true,
        AttachStderr: true,
      },
      function (err: Error, exec: any) {
        if (err) return reject(err);

        exec.start(function (err: Error, stream: any) {
          if (err) return reject(err);

          let result = "";
          stream.on("data", function (chunk: any) {
            result += chunk.toString("utf8");
          });

          stream.on("end", function () {
            resolve(result);
          });
        });
      }
    );
  });
}

class AirflowClient {
  constructor(private containerName: string) {}

  private async unpauseDAG(dagName: string) {
    const result = await executeCommand(
      this.containerName,
      `airflow dags unpause ${dagName}`
    );
    console.log(result);
  }

  async triggerDAG(dagName: string) {
    await this.unpauseDAG(dagName);
    const result = await executeCommand(
      this.containerName,
      `airflow dags trigger ${dagName}`
    );

    const runIdRegexp = result.match(
      /manual__(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2})/
    );
    if (runIdRegexp) {
      console.log(result);
      const runId = runIdRegexp[0];
      const runDate = runIdRegexp[1];
      return { runId, runDate };
    }
  }

  async waitDAGRun(dagName: string, runDate: string) {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const result1 = await executeCommand(
          this.containerName,
          `airflow dags state ${dagName} ${runDate}`
        );
        const isNotRunning = result1.match(/running/);
        if (!isNotRunning) {
          clearInterval(intervalId);
          const isSuccess = result1.match(/success/);
          if (isSuccess) {
            resolve(true);
          } else {
            reject(false);
          }
        }
      }, 1000);
    });
  }
}

export { AirflowClient, waitForService };
