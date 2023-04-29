# Airflow BigQuery Docker

## Prerequisites
- Docker
- Docker Compose

## Usage
1. Clone this repository
2. Navigate to the cloned directory
3. Start the services with `docker-compose up`
4. Access the Airflow web interface at `http://localhost:8080`

## Notes
- This project uses the Airflow 2.1.4 image
- The `dags` folder is mounted as a volume in the Airflow container
- A sample DAG (`bigquery_example.py`) is included in the `dags` folder
- The `docker-compose.yml` file also includes a BigQuery emulator service
- The BigQuery emulator service is exposed at `http://localhost:9050`
- The `bigquery_example.py` DAG uses the BigQueryHook to connect to the emulator

## Verify table content

```
bq --api http://localhost:9050 query --project_id=project-test "SELECT * FROM project-test.my_dataset.my_new_table"
```