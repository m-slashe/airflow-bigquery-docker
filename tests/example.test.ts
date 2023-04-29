import { AirflowClient, waitForService } from "./utils";
import execa from "execa";

describe("Testing docker composer", () => {
  const CONTAINER_NAME = "airflow-bigquery-docker-airflow-webserver-1";

  beforeEach(async () => {
    const { stdout } = await execa("docker", ["compose", "up", "-d"]);
    console.log(stdout);

    await waitForService(CONTAINER_NAME);
  }, 120000);

  afterEach(async () => {
    const { stdout } = await execa("docker", [
      "compose",
      "down",
      "--volumes",
      "--remove-orphans",
    ]);
    console.log(stdout);
  }, 60000);

  test("Should initialize docker composer", async () => {
    const airflowClient = new AirflowClient(CONTAINER_NAME);
    const dagName = "bigquery_emulator_test";
    const result = await airflowClient.triggerDAG(dagName);
    console.log(`DAG Id: ${result?.runId}`);
    if (!result?.runDate) {
      throw new Error("Run date not found");
    }
    const runSuccessfully = await airflowClient.waitDAGRun(
      dagName,
      result.runDate
    );
    if (!runSuccessfully) {
      throw new Error("dag failed");
    }

    const { stdout } = await execa("bq", [
      "--api",
      "http://localhost:9050",
      "query",
      "--project_id=project-test",
      "--format=json",
      "SELECT * FROM project-test.my_dataset.my_new_table",
    ]);

    const resultQuery = JSON.parse(stdout);

    expect(resultQuery).toEqual([
      { date: "2022-12-31", greeting: "Hello World", number: "123" },
    ]);
  }, 30000);
});
