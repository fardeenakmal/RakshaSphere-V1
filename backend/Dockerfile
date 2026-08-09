# Production Multi-Stage Dockerfile for Spring Boot 3.2 Backend Core
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Install gcc for compiling JNI
RUN apt-get update && apt-get install -y gcc libc6-dev

COPY src ./src
RUN mvn clean package -DskipTests

# Compile the JNI C file after maven clean!
RUN mkdir -p /app/target/native && \
    gcc -shared -fpic -I"$JAVA_HOME/include" -I"$JAVA_HOME/include/linux" \
    src/main/c/eBpfDriver.c -o /app/target/native/libebpfdriver.so

# Use Jammy instead of Alpine to match glibc from builder
FROM eclipse-temurin:21-jre-jammy AS runner

WORKDIR /app
EXPOSE 8080

COPY --from=builder /app/target/rakshasphere-backend-1.0.0-RELEASE.jar app.jar
COPY --from=builder /app/target/native/libebpfdriver.so /usr/lib/libebpfdriver.so

ENTRYPOINT ["java", "-Djava.library.path=/usr/lib", "-jar", "app.jar"]
