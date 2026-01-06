# NeighbourHub-Backend
NeighbourHub is a community-centric issue reporting platform that enables residents to report local problems such as road damage and view the most critical issues based on AI-assisted prioritization.
This repository contains the backend service built using Node.js, Express, MongoDB, and Firebase Authentication.

🚀 Features

User authentication using Firebase Auth

REST APIs for reporting and managing local issues

AI-assisted issue prioritization based on:

Community upvotes

Time since issue was reported

Presence of image proof

Severity analysis from issue description

Location-based issue filtering

Admin controls for issue status updates

🧠 AI-Assisted Prioritization (Core Logic)

Each reported issue is assigned a priority score, which determines its visibility order in the feed.

Priority Score Factors:

Number of upvotes

Issue age (older unresolved issues get higher priority)

Image presence (adds credibility)

Severity keywords detected from description (AI-lite NLP)

Issues with higher priority scores appear at the top.

🛠️ Tech Stack

Node.js

Express.js

MongoDB + Mongoose

Firebase Authentication

REST API architecture
