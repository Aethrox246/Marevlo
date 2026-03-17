FROM eclipse-temurin:17-jdk

# Create unprivileged user for safer execution
RUN useradd -m sandbox

WORKDIR /sandbox

USER sandbox

CMD ["sleep", "infinity"]