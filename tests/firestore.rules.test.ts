import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ID = "baserootio-test";

describe("Firestore Security Rules", () => {
  const rulesPath = path.resolve(process.cwd(), "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  let testEnv: Awaited<ReturnType<typeof initializeTestEnvironment>>;

  const uidUser = "user_1";
  const uidCreator = "creator_1";
  const uidAdmin = "admin_1";

  const agentId = "agent_1";

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: "127.0.0.1",
        port: 8080,
        rules,
      },
    });

    // Seed data with rules disabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, "users", uidUser), {
        uid: uidUser,
        role: "user",
        displayName: "User One",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await setDoc(doc(db, "users", uidCreator), {
        uid: uidCreator,
        role: "creator",
        displayName: "Creator One",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await setDoc(doc(db, "users", uidAdmin), {
        uid: uidAdmin,
        role: "admin",
        displayName: "Admin One",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await setDoc(doc(db, "agents", agentId), {
        creatorUid: uidCreator,
        title: "Agent One",
        description: "Test agent description",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "active",
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("unauthenticated cannot write payments", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "payments", "p1"), {
        fromUid: uidUser,
        toUid: uidCreator,
        amount: 1,
        createdAt: Date.now(),
      } as any),
    );
  });

  it("authenticated user cannot create payments (server-only)", async () => {
    const db = testEnv.authenticatedContext(uidUser).firestore();
    await assertFails(
      setDoc(doc(db, "payments", "p2"), {
        fromUid: uidUser,
        toUid: uidCreator,
        amount: 1,
        createdAt: Date.now(),
      } as any),
    );
  });

  it("user can update their own safe profile fields but cannot change role", async () => {
    const db = testEnv.authenticatedContext(uidUser).firestore();

    // allowed: displayName
    await assertSucceeds(
      setDoc(
        doc(db, "users", uidUser),
        { displayName: "User One Updated", updatedAt: Date.now() },
        { merge: true },
      ),
    );

    // forbidden: role change
    await assertFails(
      setDoc(doc(db, "users", uidUser), { role: "admin", updatedAt: Date.now() } as any, { merge: true }),
    );
  });

  it("basic user cannot create agent (creator-only)", async () => {
    const db = testEnv.authenticatedContext(uidUser).firestore();
    await assertFails(
      setDoc(doc(db, "agents", "agent_user_create"), {
        creatorUid: uidUser,
        title: "Nope",
        description: "Should fail",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any),
    );
  });

  it("creator can create agent if creatorUid matches", async () => {
    const db = testEnv.authenticatedContext(uidCreator).firestore();
    await assertSucceeds(
      setDoc(doc(db, "agents", "agent_creator_create"), {
        creatorUid: uidCreator,
        title: "Creator Agent",
        description: "Created by creator",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any),
    );
  });

  it("user cannot create agent version for someone else's agent", async () => {
    const db = testEnv.authenticatedContext(uidUser).firestore();
    await assertFails(
      setDoc(doc(db, "agent_versions", "v1"), {
        agentId,
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any),
    );
  });

  it("agent owner can create agent version", async () => {
    const db = testEnv.authenticatedContext(uidCreator).firestore();
    await assertSucceeds(
      setDoc(doc(db, "agent_versions", "v2"), {
        agentId,
        version: "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any),
    );
  });

  it("user can read public agents", async () => {
    const db = testEnv.authenticatedContext(uidUser).firestore();
    const snap = await getDoc(doc(db, "agents", agentId));
    expect(snap.exists()).toBe(true);
  });

  it("user cannot write agent_runs (server-only)", async () => {
    const db = testEnv.authenticatedContext(uidUser).firestore();
    await assertFails(
      setDoc(doc(db, "agent_runs", "run1"), {
        userUid: uidUser,
        agentId,
        createdAt: Date.now(),
      } as any),
    );
  });
});
