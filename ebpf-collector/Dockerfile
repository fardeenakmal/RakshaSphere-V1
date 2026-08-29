FROM debian:bookworm-slim

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        bpftool \
        iproute2 \
        iputils-ping \
        python3 \
        python3-pip \
        python3-uvicorn \
        python3-fastapi \
        python3-pydantic && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY rakshasphere_xdp.bpf.o /app/rakshasphere_xdp.bpf.o
COPY collector.py /app/collector.py

EXPOSE 7000
CMD ["python3", "collector.py"]
