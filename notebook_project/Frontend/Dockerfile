FROM jupyter/base-notebook:latest

RUN pip install jupyterlab

COPY jupyter_server_config.py /etc/jupyter/

CMD ["start-notebook.sh", "--NotebookApp.token=''"]