/**
 * Batch 3 — fixes four remaining edge-label cluster diagrams:
 *
 *  - Testing pyramid: "Low|High|High|Low" in 2→2 fan (test types → cost/speed)
 *  - HTTP/3 QUIC:     QUIC fans to 3 targets with "implements|supports|achieves"
 *  - Polling vs WS:   4 protocols fan-in to one target with "simple|moderate|high|server-driven"
 *  - Kafka ordering:  Partition fans to Ordering+Parallelism with "Ensures|Increases"
 *
 *  Fix: remove all edge labels; encode context in sublabels + captions.
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { renderDiagramSpec } from './diagram-spec-renderer';
import type { DiagramSpec } from './extract-seed-types';

loadEnv({ path: '.env.local' });

const FIXES: Array<{ idPrefix: string; label: string; spec: DiagramSpec }> = [

  {
    idPrefix: 'fe-prep-2-testing-pyramid-and-the-variant-trophy-what-is-the-test',
    label: 'Testing pyramid',
    spec: {
      direction: 'TD',
      nodes: [
        { id: 'unit', label: 'Unit Tests',    sublabel: 'many · cheap · instant',     color: 'green'  },
        { id: 'int',  label: 'Integration',   sublabel: 'medium · balanced',          color: 'blue'   },
        { id: 'e2e',  label: 'E2E Tests',     sublabel: 'few · expensive · slow',     color: 'orange' },
        { id: 'goal', label: 'Confidence',    sublabel: 'fast feedback + coverage',   color: 'teal'   },
      ],
      edges: [
        { from: 'unit', to: 'goal' },
        { from: 'int',  to: 'goal' },
        { from: 'e2e',  to: 'goal' },
      ],
      caption: '~70% unit · ~20% integration · ~10% E2E · each layer adds confidence',
    },
  },

  {
    idPrefix: 'sys-design-prep-v1-networking-how-does-http-3-quic-improve-u',
    label: 'HTTP/3 QUIC',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'tcp',    label: 'TCP',         sublabel: 'reliable, HOL blocking',     color: 'red'    },
        { id: 'udp',    label: 'UDP',         sublabel: 'fast, unreliable',           color: 'orange' },
        { id: 'quic',   label: 'QUIC',        sublabel: 'UDP + reliability layer',    color: 'blue'   },
        { id: 'tls',    label: 'TLS Built-in',sublabel: '0-RTT handshake',            color: 'teal'   },
        { id: 'stream', label: 'Multiplexed', sublabel: 'no HOL between streams',     color: 'purple' },
        { id: 'perf',   label: 'HTTP/3 Perf', sublabel: 'fast + resilient + secure',  color: 'green'  },
      ],
      edges: [
        { from: 'tcp',    to: 'quic'   },
        { from: 'udp',    to: 'quic'   },
        { from: 'quic',   to: 'tls'    },
        { from: 'quic',   to: 'stream' },
        { from: 'tls',    to: 'perf'   },
        { from: 'stream', to: 'perf'   },
      ],
      caption: 'QUIC = UDP + reliability + TLS → eliminates HOL blocking + 0-RTT reconnects',
    },
  },

  {
    idPrefix: 'fe-prep-frontend-system-design-polling-vs-long-polling-vs-websock',
    label: 'Polling vs WebSocket vs SSE',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'q',     label: 'Real-time?',   sublabel: 'choose by use case',              color: 'teal'   },
        { id: 'poll',  label: 'Polling',       sublabel: 'simple · high latency · periodic', color: 'orange' },
        { id: 'lpoll', label: 'Long-polling',  sublabel: 'lower latency · server held',     color: 'blue'   },
        { id: 'ws',    label: 'WebSocket',     sublabel: 'bidirectional · persistent conn', color: 'purple' },
        { id: 'sse',   label: 'SSE',           sublabel: 'server push · EventSource API',   color: 'green'  },
      ],
      edges: [
        { from: 'q', to: 'poll'  },
        { from: 'q', to: 'lpoll' },
        { from: 'q', to: 'ws'    },
        { from: 'q', to: 'sse'   },
      ],
      caption: 'WebSocket: bidirectional · SSE: server-only push · polling: simplest (use sparingly)',
    },
  },

  {
    idPrefix: 'sys-design-prep-v1-stream-processing-how-does-kafka-ensure-messag',
    label: 'Kafka message ordering',
    spec: {
      direction: 'LR',
      nodes: [
        { id: 'topic',  label: 'Topic',          sublabel: 'N partitions per topic',        color: 'teal'   },
        { id: 'part',   label: 'Partition',       sublabel: 'ordered FIFO queue',            color: 'blue'   },
        { id: 'key',    label: 'Partition Key',   sublabel: 'same key → same partition',     color: 'orange' },
        { id: 'cg',     label: 'Consumer Group',  sublabel: 'partition ↔ consumer 1:1',      color: 'purple' },
        { id: 'rep',    label: 'Replication',     sublabel: 'fault-tolerant copies',         color: 'green'  },
      ],
      edges: [
        { from: 'topic', to: 'part'  },
        { from: 'part',  to: 'key'   },
        { from: 'key',   to: 'cg'    },
        { from: 'topic', to: 'rep',   dashed: true },
      ],
      caption: 'ordering guaranteed per partition · use consistent key for related event ordering',
    },
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    let applied = 0;
    for (const fix of FIXES) {
      const q = await prisma.seedQuestion.findFirst({
        where: { id: { startsWith: fix.idPrefix } },
        select: { id: true },
      });
      if (!q) { console.log(`⚠ NOT FOUND: ${fix.idPrefix.slice(0, 60)}`); continue; }

      const svg = renderDiagramSpec(fix.spec);
      const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const dims = vb ? `${vb[1]}×${vb[2]}` : 'no viewBox';

      await prisma.seedQuestion.update({
        where: { id: q.id },
        data: { diagramSvg: svg },
      });
      console.log(`✓ ${fix.label.padEnd(36)} ${dims}`);
      applied++;
    }
    console.log(`\n✅ Fixed ${applied} / ${FIXES.length} diagrams.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(console.error);
