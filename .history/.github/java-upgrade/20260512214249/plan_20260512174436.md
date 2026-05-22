# Upgrade Plan: B2BProyect (20260512214249)

- **Generated**: 2026-05-12 21:42:49
- **HEAD Branch**: N/A
- **HEAD Commit ID**: N/A

## Available Tools

**JDKs**
- Java 17: not available (baseline will be skipped)
- Java 21: C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot\bin (required by steps 1, 3, 4)

**Build Tools**
- Maven Wrapper: 3.9.15 (`.mvn/wrapper/maven-wrapper.properties`) (compatible with Java 21)

## Guidelines

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

## Options

- Working branch: appmod/java-upgrade-20260512214249
- Run tests before and after the upgrade: true

## Upgrade Goals

- Upgrade Java runtime compatibility from 17 to 21

## Technology Stack

| Technology/Dependency | Current | Min Compatible | Why Incompatible |
| --------------------- | ------- | -------------- | ---------------- |
| Java | 17 | 21 | User requested latest LTS runtime upgrade |
| Spring Boot | 4.0.6 | 4.0.6 | Already compatible with Java 21 |
| Maven Wrapper | 3.9.15 | 3.9.0 | Supports Java 21 |
| java.version property | 17 | 21 | Controls source/target compile level |

## Derived Upgrades

- Java runtime target must be updated from 17 to 21 because the user requested the latest LTS version and the project currently specifies `java.version=17`.
- No Spring Boot or dependency version upgrades are required for Java 21 compatibility in this project because Spring Boot 4.0.6 already supports JDK 21.

## Impact Analysis

### Dependency Changes

| File | Dependency | Current | Action | Target | Reason |
|------|------------|---------|--------|--------|--------|
| pom.xml | `java.version` | 17 | upgrade | 21 | Upgrade source/target compile level to Java 21 |

### Source Code Changes

| File | Location | Current | Required Change | Reason |
|------|----------|---------|----------------|--------|
| None | N/A | N/A | N/A | No application source changes are required for this runtime upgrade |

### Configuration Changes

| File | Property/Setting | Current | Required Change | Reason |
|------|------------------|---------|----------------|--------|
| None | N/A | N/A | N/A | No configuration property changes required for Java 21 only |

### CI/CD Changes

| File | Location | Current | Required Change |
|------|----------|---------|----------------|
| None | N/A | N/A | N/A |

### Risks & Warnings

- **Baseline JDK unavailable**: Java 17 is not installed on this machine, so the baseline will be skipped. This means we cannot compare pre-upgrade test results on the exact current runtime, but the project will still be validated with Java 21.
- **No Git version control**: Changes are not tracked via git in this workspace (`GIT_AVAILABLE=false`). The upgrade plan and files will still be applied, but there is no repository snapshot or commit history.

## Upgrade Steps

- Step 1: Setup Environment
  - **Rationale**: Confirm the upgrade runtime and build tool environment before changing the project.
  - **Changes to Make**: Validate Java 21 installation and Maven wrapper compatibility.
  - **Verification**: `./mvnw -version` with Java 21, expected success.

- Step 2: Setup Baseline
  - **Rationale**: The baseline run ensures current behavior is known before upgrade.
  - **Changes to Make**: None. This step is skipped because Java 17 is not installed on the machine.
  - **Verification**: skipped.

- Step 3: Upgrade Java target version
  - **Rationale**: Apply the runtime upgrade with the minimal required build configuration change.
  - **Changes to Make**: Update `pom.xml` `java.version` property from 17 to 21.
  - **Verification**: `./mvnw clean test-compile -q` with Java 21, expected success.

- Step 4: Final Validation
  - **Rationale**: Verify the upgraded runtime is fully supported and tests pass.
  - **Changes to Make**: None beyond Step 3.
  - **Verification**: `./mvnw clean test -q` with Java 21, expected success.
