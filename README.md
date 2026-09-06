````markdown
# UGV Mission Control — Frontend

A real-time mission control dashboard for a camera-based autonomous Unmanned Ground Vehicle (UGV).

This frontend was developed as part of a hackathon project focused on autonomous navigation in GPS-denied environments. It provides an operator-facing interface for monitoring the robot, its map, navigation state, telemetry, and system health.

The frontend is designed to receive live data from a ROS 2 system through a WebSocket/rosbridge connection.

---

## Overview

The dashboard gives an operator a clear view of what the robot is doing while it navigates through an environment.

It provides:

- Live robot position and heading
- SLAM-generated occupancy map
- Planned navigation path
- Traveled path
- Navigation and mission status
- Robot velocity
- System health
- Visual SLAM information
- ROS bridge / data source status

The interface also supports mock data, making it possible to develop and test the UI without a running robot or ROS 2 system.

---

## Architecture

The frontend acts as the interface between the ROS 2 navigation stack and the operator.

```text
ROS 2 / Robot
      │
      ▼
  rosbridge
      │
   WebSocket
      │
      ▼
 RosDataBridge
      │
      ▼
   Zustand
      │
      ▼
 React Dashboard
      │
      ▼
   Operator
````

A `DataBridge` abstraction separates the UI from the underlying data source. This allows the dashboard to use mock data during development while also supporting live ROS 2 data.

---

## Tech Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* ROS 2
* rosbridge WebSocket
* Docker

---

## ROS 2 Integration

The frontend connects to a running rosbridge WebSocket server at:

```text
ws://localhost:9090
```

The ROS bridge currently subscribes to topics including:

```text
/odom
/map
/global_path
/goal_pose
/goal_reached
```

ROS 2 messages are converted into application state through `RosDataBridge` before being consumed by the React components.

For example:

```text
/odom
  │
  ▼
RosDataBridge
  │
  ▼
RobotState
  │
  ▼
Zustand
  │
  ▼
Dashboard
```

This keeps ROS-specific message handling separate from the presentation layer.

---

## Project Structure

```text
src/
├── bridge/
│   ├── DataBridge.ts
│   └── RosBridge.ts
│
├── components/
│   └── ...
│
├── data/
│   └── mock.ts
│
├── store/
│   └── useAppStore.ts
│
├── views/
│   └── DashboardView.tsx
│
├── types/
│   └── ...
│
└── App.tsx
```

### `bridge/`

Contains the interface between the frontend and external data sources.

* `DataBridge.ts` defines the data contract used by the application.
* `RosBridge.ts` implements that contract using ROS 2 through rosbridge.

### `store/`

Contains the Zustand application store.

Incoming ROS updates are merged into the application state and exposed to React components.

### `components/`

Contains the reusable dashboard components for telemetry, navigation, system status, mapping, and other UI elements.

### `views/`

Contains higher-level application views.

### `data/`

Contains mock data used for UI development and testing without a live ROS 2 system.

---

## Running the Frontend

### Requirements

* Node.js
* npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will then be available through the Vite development server.

---

## Type Checking

Run TypeScript type checking with:

```bash
npm run typecheck
```

---

## Live ROS 2 Mode

To use live robot data, a ROS 2 system with rosbridge must be running and accessible at:

```text
ws://localhost:9090
```

Once connected, the frontend receives the configured ROS 2 topics and updates the dashboard in real time.

If rosbridge is unavailable, the application can still be run using its mock data.

---

## About the Project

This frontend was developed as part of a larger autonomous UGV system designed for navigation in GPS-denied environments.

The overall system combines:

* Camera-based perception
* Visual SLAM / visual odometry
* ROS 2
* Nav2
* Gazebo simulation
* Path planning
* Collision avoidance

My contribution focused on the **operator-facing mission control interface and the ROS 2 → frontend integration layer**.

The goal was to turn the underlying robotics stack into a clear, real-time interface through which an operator can monitor the robot, its environment, navigation state, and system health.

---

## Status

The frontend and ROS 2 data bridge have been integrated with the project's ROS 2 simulation environment.

The deeper navigation and robot-control functionality remains dependent on the underlying ROS 2 and Nav2 stack.

---

## Project Context

Built as part of a hackathon exploring autonomous UGV navigation without dependence on GPS.

```text
Camera
   │
   ▼
Perception / Visual SLAM
   │
   ▼
ROS 2
   │
   ├──────────────► Mission Control Dashboard
   │
   ▼
Navigation / Path Planning
   │
   ▼
UGV
```

```
```


### PARENT REPO 
https://github.com/saiprashanth802/ugv-camera-slam-sih.git
