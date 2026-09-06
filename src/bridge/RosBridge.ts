import type { DataBridge, StateUpdate } from './DataBridge';
import type {
  
  OccupancyGrid,
  RobotState,
  MissionState,
  MapState,
  SystemHealth,
} from '../types';

type RosMessage = {
  op?: string;
  topic?: string;
  msg?: any;
};

export class RosDataBridge implements DataBridge {
  private ws: WebSocket | null = null;

  private listeners = new Set<
    (update: StateUpdate) => void
  >();

  private robot: RobotState = {
    x: 0,
    y: 0,
    heading: 0,
    linearVelocity: 0,
    angularVelocity: 0,
  };

  private mission: MissionState = {
    status: 'IDLE',
    goal: null,
    distanceToGoal: null,
    recoveries: 0,
    elapsedMs: 0,
  };

  private map: MapState = {
    grid: null,
    plannedPath: [],
    traveledPath: [],
  };

  private health: SystemHealth = {
    ros: 'UNKNOWN',
    gazebo: 'UNKNOWN',
    rtabmap: 'UNKNOWN',
    nav2: 'UNKNOWN',
    camera: 'UNKNOWN',
    slam: 'UNKNOWN',
    bridge: 'OFFLINE',
  };

  subscribe(
    onUpdate: (update: StateUpdate) => void
  ): () => void {
    this.listeners.add(onUpdate);

    if (!this.ws) {
      this.connect();
    }

    return () => {
      this.listeners.delete(onUpdate);
    };
  }

  private emit(update: StateUpdate) {
    for (const listener of this.listeners) {
      listener(update);
    }
  }

  private connect() {
    console.log('[RosDataBridge] connect() called')
    
    this.ws = new WebSocket('ws://localhost:9090');

    this.ws.onopen = () => {
      console.log('[RosDataBridge] Connected to rosbridge');

      this.health = {
        ...this.health,
        bridge: 'OPERATIONAL',
      };

      this.emit({
        dataSource: 'ros',
        health: this.health,
      });

      this.subscribeTopic(
        '/odom',
        'nav_msgs/msg/Odometry'
      );

      this.subscribeTopic(
        '/map',
        'nav_msgs/msg/OccupancyGrid'
      );

      this.subscribeTopic(
        '/global_path',
        'nav_msgs/msg/Path'
      );

      this.subscribeTopic(
        '/goal_pose',
        'geometry_msgs/msg/PoseStamped'
      );

      this.subscribeTopic(
        '/goal_reached',
        'std_msgs/msg/Bool'
      );
    };

    this.ws.onmessage = (event) => {
      const data: RosMessage = JSON.parse(event.data);

      if (!data.topic || !data.msg) {
        return;
      }

      switch (data.topic) {
        case '/odom':
          this.handleOdom(data.msg);
          break;

        case '/map':
          this.handleMap(data.msg);
          break;

        case '/global_path':
          this.handleGlobalPath(data.msg);
          break;

        case '/goal_pose':
          this.handleGoal(data.msg);
          break;

        case '/goal_reached':
          this.handleGoalReached(data.msg);
          break;
      }
    };

    this.ws.onerror = () => {
      console.error('[RosDataBridge] WebSocket error');

      this.health = {
        ...this.health,
        bridge: 'OFFLINE',
      };

      this.emit({
        dataSource: 'ros',
        health: this.health,
      });
    };

    this.ws.onclose = () => {
      console.warn('[RosDataBridge] Disconnected');

      this.health = {
        ...this.health,
        bridge: 'OFFLINE',
      };

      this.emit({
        dataSource: 'ros',
        health: this.health,
      });

      this.ws = null;
    };
  }

  private subscribeTopic(
    topic: string,
    type: string
  ) {
    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        op: 'subscribe',
        topic,
        type,
      })
    );
  }

  private handleOdom(msg: any) {
    const position = msg.pose?.pose?.position;
    const orientation = msg.pose?.pose?.orientation;
    const twist = msg.twist?.twist;

    if (!position || !orientation || !twist) {
      return;
    }

    const heading = this.quaternionToYaw(
      orientation.x,
      orientation.y,
      orientation.z,
      orientation.w
    );

    this.robot = {
      x: position.x,
      y: position.y,
      heading,
      linearVelocity: twist.linear?.x ?? 0,
      angularVelocity: twist.angular?.z ?? 0,
    };

    this.map.traveledPath = [
      ...(this.map.traveledPath ?? []),
      {
        x: position.x,
        y: position.y,
      },
    ];

    this.emit({
      dataSource: 'ros',
      robot: this.robot,
      map: this.map,
    });
  }

  private handleMap(msg: any) {
    if (!msg.info || !Array.isArray(msg.data)) {
      return;
    }

    const grid: OccupancyGrid = {
      width: msg.info.width,
      height: msg.info.height,
      resolution: msg.info.resolution,
      origin: {
        x: msg.info.origin.position.x,
        y: msg.info.origin.position.y,
      },
      data: Int8Array.from(msg.data),
    };

    this.map = {
      ...this.map,
      grid,
    };

    this.emit({
      dataSource: 'ros',
      map: this.map,
    });
  }

  private handleGlobalPath(msg: any) {
    if (!Array.isArray(msg.poses)) {
      return;
    }

    const plannedPath = msg.poses
      .map(
        (pose: any) =>
          pose?.pose?.position
      )
      .filter(Boolean)
      .map((position: any) => ({
        x: position.x,
        y: position.y,
      }));

    this.map = {
      ...this.map,
      plannedPath,
    };

    this.emit({
      dataSource: 'ros',
      map: this.map,
    });
  }

  private handleGoal(msg: any) {
    const position = msg.pose?.position;

    if (!position) {
      return;
    }

    this.mission = {
      ...this.mission,
      goal: {
        x: position.x,
        y: position.y,
      },
    };

    this.emit({
      dataSource: 'ros',
      mission: this.mission,
    });
  }

  private handleGoalReached(msg: any) {
    const reached = Boolean(msg.data);

    this.mission = {
      ...this.mission,
      status: reached
        ? 'GOAL_REACHED'
        : 'NAVIGATING',
    };

    this.emit({
      dataSource: 'ros',
      mission: this.mission,
    });
  }

  private quaternionToYaw(
    x: number,
    y: number,
    z: number,
    w: number
  ): number {
    return Math.atan2(
      2 * (w * z + x * y),
      1 - 2 * (y * y + z * z)
    );
  }
}