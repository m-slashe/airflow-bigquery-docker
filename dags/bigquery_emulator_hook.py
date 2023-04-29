from airflow.providers.google.common.hooks.base_google import GoogleBaseHook
from google.api_core.client_options import ClientOptions
from google.auth.credentials import AnonymousCredentials
from google.cloud import bigquery
from airflow.providers.google.cloud.hooks.bigquery import BigQueryHook


class BigQueryEmulatorHook(BigQueryHook):

    project_id = 'project-test'

    def __init__(self):
        super().__init__()
        self._cached_credentials = 1
        self._cached_project_id = self.project_id

    def get_connection(self, conn_id: str):
        class FakeConnection:
            extra_dejson = {}

        return FakeConnection()

    def get_client(self, project_id=None, location=None):
        return bigquery.Client(
            project=self.project_id,
            client_options=ClientOptions(
                api_endpoint="http://bigquery-emulator:9050"),
            credentials=AnonymousCredentials(),
        )
