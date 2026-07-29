# Pre-Selection Category and Technology Analysis

## Earlier pre-selection category and theme analysis

> Historical note: this comparison was written before ReBuild Loop was selected. Its generic Waste-track recommendation is superseded by the project-specific, revalidated Open Innovation decision in the [ReBuild Loop overview](../03-rebuild-loop/01-overview-problem-and-hackathon-fit.md).

### Official position

The programme does **not** state that any category receives preference. Rural Health, Waste Collection, Traffic Management, and Open Innovation are presented as equally valid choices. The programme page tells participants to select one of the defined tracks or enter through Open Innovation; it does not publish separate scoring weights, reserved shortlist positions, or advantages for a particular category.

Therefore, category selection should be based on the team's ability to validate the problem and deliver a convincing end-to-end agent rather than an assumed organiser preference.

### Strategic comparison

| Strategic rank | Track                  | Strengths                                                                                                                | Risks                                                                                                  | Assessment                                                                                   |
| -------------: | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
|              1 | **Waste Collection**   | Clear workflow, accessible sample data, visual demo, measurable resolution metrics, natural routing and escalation tools | Real municipal integration may be unavailable during the prototype                                     | Best overall balance of impact, feasibility, and agentic depth                               |
|              2 | **Rural Health**       | Strong social impact, important operational problem, compelling story for judges                                         | Sensitive personal data, privacy requirements, domain validation, and limited access to health workers | Potentially the strongest impact entry if validated responsibly                              |
|              3 | **Open Innovation**    | Complete freedom to use an existing area of expertise or unique dataset                                                  | Broad category, likely crowded, easy to produce a generic assistant without defensible impact          | Choose only when the team already has a distinctive and validated problem                    |
|              4 | **Traffic Management** | Visually impressive, suitable for multimodal AI, optimisation, and real-time coordination                                | Credibility often depends on live traffic feeds, cameras, sensors, maps, or municipal access           | Technically attractive but the hardest to demonstrate convincingly within the available time |

### Pre-selection recommendation

The default recommendation is **Waste Collection and Bin Overflow**.

It offers the strongest combination of:

- A recognisable public problem
- Clear users: residents, control-room staff, drivers, supervisors, and municipal managers
- Multimodal inputs such as text, photographs, and location
- Real agent actions rather than question answering
- Routing, assignment, notification, monitoring, and escalation workflows
- Demonstrable Google technology integration
- Measurable outcomes such as response time, resolution time, route distance, duplicate-report reduction, and overflow recurrence
- Lower privacy and safety risk than a health solution
- A credible prototype even without direct municipal-system access

Choose **Rural Health** instead if the team has reliable access to ASHA workers, ANMs, PHC supervisors, or relevant domain experts and can design appropriate privacy protections.

Choose **Open Innovation** instead only if the team already possesses a clearly differentiated problem, user access, useful data, or a domain advantage that is stronger than the defined tracks.

### Recommended theme

> **Autonomous Municipal Waste Resolution Agent** — an AI agent that receives citizen waste reports, understands text and images, detects duplicate incidents, prioritises cases, recommends or optimises collection routes, assigns the responsible team, tracks resolution, informs residents, and escalates overdue cases.

This should be positioned as an operational resolution system, not merely a waste-information chatbot.

### Target users

- Residents reporting waste issues
- Municipal control-room operators
- Waste-collection supervisors
- Vehicle drivers and field crews
- Ward officers and city administrators

### Core workflow

1. A resident submits a photograph, description, and location.
2. Gemini analyses the image and text to classify the waste type, severity, and safety risk.
3. The agent validates the location and requests missing information.
4. It searches active incidents to identify possible duplicates.
5. Duplicate reports are merged while retaining reporter information and evidence.
6. The agent prioritises the incident using severity, proximity to sensitive locations, report volume, and time outstanding.
7. A planning agent identifies the appropriate collection team and recommends an efficient route.
8. A human operator approves consequential assignments or route changes when required.
9. The system notifies the field team and gives the resident a tracking reference.
10. The monitoring agent checks progress and service-level deadlines.
11. Overdue or high-risk incidents are escalated to a supervisor.
12. The field team uploads completion evidence.
13. Gemini verifies whether the evidence appears consistent with resolution.
14. The resident is notified and can confirm or dispute closure.
15. BigQuery dashboards report trends, response times, hotspots, and recurring overflow locations.

### Agent roles

- **Intake agent:** structures citizen reports and asks for missing information
- **Vision and classification agent:** analyses photographs and classifies waste and urgency
- **Duplicate-detection agent:** finds related reports by location, time, text, and image similarity
- **Planning agent:** determines priority, responsible team, and recommended route
- **Action agent:** creates assignments and sends authorised notifications
- **Monitoring agent:** tracks deadlines and initiates escalation
- **Verification agent:** checks completion evidence and closure consistency
- **Analytics agent:** explains operational patterns and recommends preventive action

These may initially be implemented as specialised components inside one ADK application. They should become separately deployed agents only when independent scaling or ownership justifies the additional complexity.

### Suggested Google stack for this theme

| Technology             | Role in the proposed solution                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Gemini                 | Multimodal report understanding, classification, structured extraction, planning, completion-evidence analysis, and explanations |
| Google AI Studio       | Prompt experiments, schema design, and multimodal prototyping                                                                    |
| Google ADK             | Root-agent orchestration, specialised agents, tools, sessions, state, and evaluation                                             |
| MCP                    | Standardised access to maps, messaging, incident data, and municipal-system adapters                                             |
| A2A                    | Optional communication with separately deployed routing, municipal, or field-operation agents                                    |
| Google Cloud Run       | Deploy the web API, ADK service, background worker, and optional MCP gateway                                                     |
| Firestore or Cloud SQL | Transactional incident, user, assignment, and workflow state                                                                     |
| Cloud Storage          | Store report photographs and completion evidence                                                                                 |
| Pub/Sub                | Event-driven assignment, notification, monitoring, and escalation                                                                |
| BigQuery               | Operational events, hotspot analysis, performance metrics, and impact reporting                                                  |
| Vertex AI              | Managed Gemini access, evaluation, enterprise controls, and production scaling where needed                                      |
| Agent Engine           | Optional managed agent runtime if it offers a clear deployment advantage over Cloud Run                                          |

### Demonstration scenario

A strong three-minute demo could show:

1. A resident uploads an image of an overflowing bin near a school.
2. Gemini identifies mixed waste, estimates high urgency, and extracts the location.
3. The agent detects two related reports and merges them.
4. It explains why the incident is high priority.
5. It selects a nearby collection team and proposes a route adjustment.
6. An operator approves the assignment.
7. The field-team view receives the task and uploads an after-service photograph.
8. The verification agent checks the evidence and closes the incident.
9. The resident receives a resolution message.
10. A BigQuery-backed dashboard shows the improved response time and identifies the location as a recurring hotspot.

### Success metrics

- Median time from report to assignment
- Median time from report to resolution
- Percentage of cases resolved within the target service level
- Duplicate reports detected and consolidated
- Collection distance or time saved through route optimisation
- Percentage of closures supported by valid evidence
- Reopened or disputed incidents
- Recurring hotspot frequency
- Resident satisfaction after closure
- Agent accuracy, tool success rate, latency, and human-override rate

### Important design safeguards

- Require human approval before consequential assignments, enforcement, or route changes during the prototype.
- Do not expose a resident's personal information on public dashboards.
- Remove precise personal-location information when it is no longer required.
- Restrict tool permissions using least-privilege service accounts.
- Store secrets in Secret Manager.
- Log agent decisions, tool calls, approvals, and failures for auditability.
- Provide operators with a manual override and clear explanation of recommendations.
- Treat AI-generated severity and completion verification as decision support unless validated for autonomous use.

## Expected technology stack

The site asks participants to build with Google's AI ecosystem. It lists the following technologies:

### Models and prototyping

- Gemini
- Gemma
- Google AI Studio

### Agent frameworks and protocols

- Agent Development Kit (ADK)
- Model Context Protocol (MCP)
- Agent2Agent Protocol (A2A)
- Gemini CLI
- Antigravity, as named on the programme page

### Cloud and deployment

- Vertex AI
- Vertex AI Agent Engine
- Google Cloud
- Cloud Run
- BigQuery

The FAQ says any combination of the listed tools is acceptable. It does not state that every tool must be used.

## Recommended project tech stack

The approved technology list is a menu, not a requirement to use every product. A focused, working architecture is stronger than an unnecessarily complicated stack.

### Recommended baseline

| Layer            | Recommended technology | Purpose                                                                          |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Model            | Gemini                 | Reasoning, extraction, classification, summarisation, vision, and tool selection |
| Prototyping      | Google AI Studio       | Test prompts, model behaviour, structured output, and multimodal inputs          |
| Agent framework  | Google ADK             | Define agents, tools, workflows, sessions, delegation, and evaluation            |
| Application API  | Python with FastAPI    | Expose the agent workflow to the frontend and external systems                   |
| Deployment       | Google Cloud Run       | Run the API and agent service in a managed container                             |
| Operational data | Firestore or Cloud SQL | Store users, cases, tasks, agent state, and workflow status                      |
| Analytics        | BigQuery               | Store event history and calculate operational or impact metrics                  |
| Source control   | GitHub                 | Submission repository, documentation, issues, and version history                |

This baseline is sufficient for a strong submission. It clearly demonstrates Google's AI ecosystem while remaining realistic to build and deploy before the deadline.

### Optional additions

| Technology   | Add it when                                                                                     | Avoid it when                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Gemma        | A smaller, open-weight or locally deployable model provides a real benefit                      | Gemini already handles the workflow reliably                           |
| MCP          | The agent needs standardised access to multiple tools, databases, or third-party systems        | There are only one or two simple internal functions                    |
| A2A          | Independently deployed agents need to communicate across service boundaries                     | All specialised agents run inside one ADK application                  |
| Vertex AI    | Enterprise controls, managed model access, evaluation, security, or scaling are required        | AI Studio and the Gemini API already meet prototype needs              |
| Agent Engine | A managed production agent runtime provides useful session, deployment, or scaling capabilities | Cloud Run can host the complete agent simply and reliably              |
| Antigravity  | It materially improves the development workflow or is explicitly required by an event exercise  | It would only be added to increase the number of named technologies    |
| Gemini CLI   | It helps develop, test, review, or automate repository work                                     | It does not contribute to the submitted system or development evidence |

### Role of every approved technology

#### Gemini

Use Gemini as the primary intelligence layer. Depending on the project, it can:

- Understand text, images, documents, audio, or video
- Extract structured fields from unstructured reports
- Classify incidents and estimate urgency
- Plan multi-step work
- Select and call tools
- Explain recommendations
- Summarise cases and produce reports

The agent should not depend on free-form text alone. Prefer schemas and structured output for values used by application logic.

#### Gemma

Gemma is Google's open-model family. It is useful when the project needs:

- Local or controlled deployment
- Model customisation
- A smaller model for a narrow task
- Offline or cost-sensitive inference

Do not use both Gemini and Gemma unless their responsibilities are clearly different.

#### Google AI Studio

AI Studio is best used during exploration and prototyping:

- Compare Gemini models
- Test system instructions
- Test multimodal inputs
- Design structured JSON output
- Tune temperature and other generation settings
- Export starter code

Record important prompt and model decisions in the repository rather than leaving them only inside AI Studio.

#### Antigravity

The programme page lists Antigravity among its agent and development tools. If used, document its concrete role in research, coding, orchestration, testing, or automation. Do not make it a critical runtime dependency without confirming its availability and suitability for the final deployment.

#### Agent Development Kit (ADK)

ADK should be the primary agent framework when the system needs:

- Agent instructions and tool definitions
- Sequential, parallel, or loop workflows
- Specialist agents coordinated by a root agent
- Session and state management
- Tool-call tracing
- Agent evaluation
- Deployment to Google infrastructure

A sensible multi-agent design might contain:

- **Intake agent:** understands and structures the incoming request
- **Verification agent:** validates data and checks for duplicates or anomalies
- **Planning agent:** chooses the next actions
- **Action agent:** calls operational tools and services
- **Monitoring agent:** checks progress, deadlines, and escalation conditions
- **Reporting agent:** produces summaries and impact analytics

Only split the workflow into multiple agents when the responsibilities are genuinely distinct.

#### Model Context Protocol (MCP)

MCP standardises how an agent connects to tools and contextual data. Possible MCP servers include:

- Database access
- Maps and geolocation
- Municipal or organisational systems
- Messaging and notification services
- Document repositories
- Search or knowledge bases

Each server should expose narrowly scoped operations. Mutating or high-impact tools should require validation, authorisation, and human approval where appropriate.

#### Agent2Agent Protocol (A2A)

A2A is relevant when separate agents or services owned by different systems need to discover capabilities, exchange tasks, and report status.

For example:

1. A citizen-service agent creates a verified incident.
2. A municipal-routing agent accepts the task.
3. A field-operations agent reports completion.
4. The citizen-service agent communicates the result to the reporter.

A2A is unnecessary if these components are simply functions or internal agents inside the same deployed application.

#### Vertex AI

Vertex AI can provide the managed production AI layer, including:

- Managed access to Gemini and other models
- Service-account-based authentication
- Enterprise security and governance
- Model and prompt evaluation
- Monitoring and scaling
- Integration with other Google Cloud services

Use Vertex AI when its operational controls strengthen the submission, not merely as a label in the architecture diagram.

#### Google Cloud

Google Cloud is the infrastructure foundation. Relevant services may include:

- Secret Manager for API keys and credentials
- IAM for least-privilege access
- Cloud Logging and Cloud Monitoring
- Firestore or Cloud SQL for application state
- Cloud Storage for images, videos, and documents
- Pub/Sub for event-driven workflows
- Firebase Hosting or another frontend hosting option

#### Cloud Run

Cloud Run is the recommended deployment target for the agent API because it supports containerised applications, HTTPS endpoints, autoscaling, service identities, and straightforward integration with other Google Cloud services.

Suggested deployable services:

- `web-app` — participant or operator interface
- `agent-api` — ADK workflow and business logic
- `mcp-server` — optional secured tool gateway
- `worker` — optional asynchronous processing and scheduled checks

Start with one service and split it only when deployment or security boundaries require separation.

#### BigQuery

Use BigQuery for analytics rather than transactional workflow state. Suitable data includes:

- Agent execution events
- Tool calls and outcomes
- Response and resolution times
- Geographic or operational trends
- Evaluation results
- Impact metrics

Avoid sending secrets, unnecessary personal data, or raw sensitive records to analytics tables.

#### Agent Engine

Vertex AI Agent Engine may be used when the project benefits from a managed agent runtime. Evaluate it for deployment, session management, observability, scaling, and integration with Vertex AI.

For a time-limited hackathon build, choose either **Cloud Run as the primary runtime** or **Agent Engine as the managed agent runtime** based on demonstrated needs. Using both is reasonable only if their boundaries are clear.

### Preferred architecture for this competition

```text
User / Operator Interface
          |
          v
Cloud Run API
          |
          v
Google ADK Root Agent ------> Gemini
          |
          +----> Internal tools or MCP servers
          |          |
          |          +----> Maps / messaging / domain APIs
          |          +----> Firestore or Cloud SQL
          |
          +----> Human approval for consequential actions
          |
          +----> BigQuery event and impact analytics
```

Optional A2A connections can be added when the solution interacts with independently deployed external agents.

### Minimum viable stack

For the first working version, use:

1. Gemini
2. Google AI Studio
3. Google ADK
4. FastAPI
5. Cloud Run
6. Firestore
7. GitHub

Add BigQuery once the system produces meaningful events or impact measurements. Add MCP, A2A, Vertex AI, Agent Engine, Gemma, or Antigravity only after the core workflow is reliable.
