# Submission Requirements and Competition Strategy

## Submission requirements

The public page instructs participants to submit:

- A working AI agent
- A demo video
- A GitHub repository link
- A clear problem statement
- An agent pitch

Submission is made through:

<https://app.hidevs.xyz/nominate/google>

The programme says participants may update their submission after submitting it. Builders are encouraged to use the resulting feedback to improve their agent and score before the deadline.

## Programme flow

### Step 1 — Submit the agent

Upload the working agent, demo video, GitHub repository, problem statement, and pitch by **5 August 2026 at 11:59 PM**.

### Step 2 — Receive immediate feedback

The platform is described as providing feedback on strengths, gaps, and possible improvements after submission.

### Step 3 — Publish and share the Agent Card

Each submission receives a public Agent Card. Participants can share this card through LinkedIn, X, WhatsApp, and other channels to gather community votes.

### Step 4 — Climb the leaderboard

The leaderboard score combines organiser evaluation, community votes, and structured feedback. Participants can iterate on their projects while the programme remains open.

### Step 5 — Top 100 Grand Finale

The Top 100 builders are shortlisted for the full-day Grand Finale at the Google Office in Bengaluru. The finale includes building, iteration, live demonstrations, mentoring, and judging.

## Leaderboard scoring

| Scoring component   |   Weight | Description                                     |
| ------------------- | -------: | ----------------------------------------------- |
| AI-agent evaluation |      50% | The organiser team's evaluation of the AI agent |
| Community votes     |      25% | Votes received through the public Agent Card    |
| Structured feedback |      25% | Feedback-related assessment of the submission   |
| **Total**           | **100%** | Combined leaderboard score                      |

### Practical implication

Technical quality determines only half of the published score. Presentation, public reach, community engagement, and the ability to respond to feedback can materially affect qualification.

The site does not publish a detailed sub-rubric explaining how the 50% technical evaluation or the 25% structured-feedback component is calculated.

## Grand Finale

| Item         | Detail                                                                |
| ------------ | --------------------------------------------------------------------- |
| Date         | Saturday, 8 August 2026                                               |
| Start        | 9:00 AM IST                                                           |
| Location     | Google Office, Bengaluru                                              |
| Participants | Top 100 builders from the national leaderboard                        |
| Duration     | Full day                                                              |
| Activities   | Build, iterate, receive mentoring, demo, pitch, and face live judging |

The public page describes the finale as an opportunity to demonstrate the agent in front of mentors, expert judges, and participants from the Google AI ecosystem.

## Published rewards

The site currently identifies the following rewards for shortlisted builders:

- Exclusive Google × AI House merchandise
- A place in the Top 100 Grand Finale Hackathon
- Exposure to mentors, judges, and the developer ecosystem
- Two additional surprises to be revealed at the finale

The national programme page does not currently specify a cash prize for the Grand Finale.

## What a strong entry should demonstrate

A competitive project should be more than a conversational interface. It should show an agent completing a useful workflow.

Recommended characteristics:

- A narrow and well-validated problem
- A clearly identified user or beneficiary
- Multi-step reasoning or planning
- Tool or API use
- The ability to take useful actions
- State management or persistent memory where relevant
- Error handling and human approval for risky actions
- Visible and meaningful use of Google's AI stack
- A deployed and reliable demonstration
- Measurable real-world outcomes
- Reproducible setup instructions
- A clear, concise demo and pitch

### Agent versus chatbot

A basic chatbot only answers questions. A stronger agent should observe a situation, decide what needs to happen, use tools, perform or coordinate actions, verify results, and maintain state.

For example, a waste-management agent could:

1. Receive a citizen report and photograph.
2. Determine the problem type and urgency.
3. Extract or request the location.
4. Check existing incidents to avoid duplicates.
5. Select the responsible municipal team.
6. Recalculate a collection route.
7. Notify the team and citizen.
8. Track the issue until it is resolved.
9. Escalate the issue if its service-level deadline is missed.

## Recommended competition strategy

### Build

- Select one concrete, high-frequency problem.
- Interview or validate the problem with potential users.
- Define one end-to-end workflow before adding features.
- Make the agent's decisions, tool calls, and results observable.
- Prefer reliability and demonstrable impact over unnecessary complexity.

### Deploy

- Provide a stable public demo where possible.
- Use Cloud Run or another suitable Google Cloud service.
- Store secrets securely and do not commit credentials.
- Prepare a fallback recorded demo in case the live system fails.

### Document

The GitHub repository should include:

- Problem and user description
- Architecture diagram
- Google technologies used
- Setup and deployment instructions
- Example workflows
- Screenshots or GIFs
- Evaluation results
- Limitations and responsible-AI considerations
- Licence and contributor information

### Pitch

A concise pitch should explain:

1. Who experiences the problem?
2. Why is it important?
3. What does the agent do autonomously?
4. Why is an agent appropriate for this workflow?
5. Which Google technologies power it?
6. What evidence demonstrates improvement?
7. How could it scale after the hackathon?

### Promote and iterate

- Submit a stable version early enough to receive feedback.
- Improve the agent before the final deadline.
- Share the Agent Card with relevant communities.
- Demonstrate progress rather than repeatedly requesting votes without context.
- Publish technical explanations, demo clips, and user-impact evidence.

## Suggested architecture

A practical submission could use:

- **Frontend:** Web or mobile interface for users and operators
- **Gemini:** Reasoning, classification, extraction, summarisation, and multimodal understanding
- **ADK:** Agent orchestration and specialised-agent coordination
- **Tools:** Domain APIs, databases, maps, messaging, search, or organisation systems
- **MCP:** Standardised access to external tools and data when appropriate
- **A2A:** Communication between separately deployed agents when justified
- **Cloud Run:** API and agent-service deployment
- **BigQuery:** Analytics, event history, reporting, or operational insights
- **Agent Engine:** Managed agent deployment where appropriate
- **Human approval:** Confirmation before consequential or irreversible actions

Avoid adding every available technology merely to increase the stack size. Each component should solve a real architectural need.

## Risks and unanswered questions

The public information reviewed does not clearly answer the following:

- Are team submissions allowed?
- What is the maximum team size?
- Can an existing project be submitted?
- Must participants reside in India or merely be available for the finale?
- Are travel and accommodation for Bengaluru covered?
- Who owns the submitted intellectual property?
- What licence or repository visibility is required?
- May non-Google models and external services be used?
- What datasets are prohibited?
- What privacy and security requirements apply?
- How are fraudulent or coordinated votes detected?
- How are ties resolved?
- What precisely determines the structured-feedback score?
- What is the detailed technical evaluation rubric?
- When exactly is the leaderboard frozen?
- Are there disqualification conditions?
- Is participation in the Grand Finale mandatory for qualification or prizes?

These items should be confirmed with the organisers before making costly travel, licensing, data, or architectural decisions.

## Verification notes

- AI House's programme page and social announcement both describe the 45-day series and Bengaluru finale.
- The Luma kickoff listing documents an associated Agent Development Kit workshop and describes it as the series kickoff.
- No separate official Google-domain competition page was located during the initial review. The collaboration is presented by the organiser and in related event material, but its detailed legal or sponsorship structure is not explained publicly.
- The public landing page describes its leaderboard as live, but the visible example leaderboard appears to contain static placeholder-style entries in the page frontend. Use the submission platform for authoritative rankings.
- Marketing audience figures such as network size or expected builder count should not be treated as verified participation counts.

## Immediate checklist

- [ ] Choose a problem track.
- [ ] Confirm individual or team participation rules.
- [ ] Validate the problem with potential users.
- [ ] Define the agent's end-to-end workflow.
- [ ] Choose only the necessary Google technologies.
- [ ] Build the smallest complete working agent.
- [ ] Deploy a reliable demo.
- [ ] Add evaluation and failure-case testing.
- [ ] Prepare the GitHub repository and documentation.
- [ ] Record a concise demo video.
- [ ] Write the problem statement and pitch.
- [ ] Submit before 5 August 2026, 11:59 PM.
- [ ] Review platform feedback and improve the entry.
- [ ] Share the Agent Card and gather legitimate votes.
- [ ] Prepare for the Bengaluru finale if shortlisted.

## Final assessment

The programme is most valuable as an opportunity to produce a credible portfolio project, gain experience with Gemini and Google's agent stack, receive public feedback, and potentially present at the Google Office in Bengaluru.

The strongest strategy is to build a **focused, reliable, end-to-end agent**, submit early, improve it using feedback, document it thoroughly, and communicate its impact clearly. Because 50% of the published leaderboard score comes from votes and structured feedback, community engagement and iteration must be planned alongside technical development.

---
