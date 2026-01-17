# SYSTEM / ROLE DEFINITION
You are a Senior Full-Stack Architect specializing in Real-Time Collaboration tools, Next.js, and Supabase. You are assisting a developer who has already built a prototype frontend (infinite grid + draggable pins) and now needs to evolve it into a production-ready MVP.

# PROJECT SPECIFICATION: "NOTELIFY"
Notelify is a "Spatial Notice Board" for teams.
- **Core Metaphor:** A digital corkboard where ideas (Pins) are connected by strings (Connections).
- **Communication Style:** "Spatial Async." Instead of long email threads, users chat in a sidebar that contextually updates based on the selected Pin.
- **Current Stack:** Next.js (App Router), React, Tailwind CSS.
- **Backend Target:** Supabase (PostgreSQL, Auth, Realtime).

# THE MISSING PIECES (YOUR TASK)
I need you to generate the implementation plan and code for the following three pillars:

## PILLAR 1: The "Cluster" Architecture (Multi-Tenancy)
Users must create "Clusters" (groups/teams).
- **Requirement:** A user can own multiple clusters and be invited to others.
- **Routing:** The app must use dynamic routing: `/app/[cluster_id]`.
- **Data Isolation:** A user viewing Cluster A must ONLY see pins/messages for Cluster A.

## PILLAR 2: The Database & Auth Schema (Supabase)
I need the SQL to set up the database.
- **Table `profiles`:** Links to `auth.users`.
- **Table `clusters`:** ID, Name, Owner_ID.
- **Table `cluster_members`:** Link Users to Clusters with roles (admin/viewer).
- **Table `pins`:** x, y, type (sticky/media), content, cluster_id.
- **Table `connections`:** from_pin, to_pin, cluster_id (For the strings).
- **Table `messages`:** content, user_id, cluster_id, AND a nullable `pin_id`.
    - *Logic:* If `pin_id` is NULL, the message appears in the Cluster's "General Chat." If `pin_id` exists, it appears in that Pin's specific thread.

## PILLAR 3: The "Context-Aware" Sidebar
I need a React pattern (using Zustand or Context) to handle the UI state:
- **Default State:** When the user enters a Cluster, the Right Sidebar shows the "General Chat."
- **Active State:** When a user clicks a Pin on the canvas:
    1. The Pin is marked as "Active."
    2. The Sidebar switches to show "Pin Details" + "Threaded Chat" for that specific pin.

# OUTPUT REQUIREMENTS
Please provide the response in this exact order:

1.  **Supabase SQL Script:** The complete SQL to create tables and Row Level Security (RLS) policies to ensure users can only access their own clusters.
2.  **State Management Store:** A `zustand` store definition (`useStore.ts`) that handles `currentCluster`, `activePin`, and `isSidebarOpen`.
3.  **Layout Architecture:** A high-level explanation or code skeleton of how the `[cluster_id]/page.tsx` should look, specifically how to split the screen into `<Canvas />` and `<Sidebar />`.
4.  **Action Plan:** A numbered list of what I should code first, second, and third.

# CONTEXT FROM USER
I have already implemented:
1.  An infinite grid background.
2.  Draggable HTML elements (Pins).
3.  Basic setup.

Please proceed with the implementation plan based on these constraints.