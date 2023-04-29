from airflow import DAG
from airflow.providers.google.cloud.operators.bigquery import BigQueryExecuteQueryOperator
from datetime import datetime
from airflow.operators.bash_operator import BashOperator
from bigquery_emulator_hook import BigQueryEmulatorHook

default_args = {
    'start_date': datetime(2023, 4, 27)
}

with DAG('bigquery_emulator_test', default_args=default_args, schedule_interval=None) as dag:
    start_task = BashOperator(
        task_id='start_task',
        bash_command='echo "Start task!"'
    )

    my_hook = BigQueryEmulatorHook()

    query = '''CREATE OR REPLACE TABLE `project-test.my_dataset.my_new_table` as (
        SELECT "Hello World" AS greeting, 123 AS number, DATE("2022-12-31") AS date
    );'''

    bq_task = BigQueryExecuteQueryOperator(
        task_id='bq_task',
        sql=query,
        use_legacy_sql=False
    )
    bq_task.hook = my_hook

    end_task = BashOperator(
        task_id='end_task',
        bash_command='echo "End task!"'
    )

    start_task >> bq_task >> end_task
