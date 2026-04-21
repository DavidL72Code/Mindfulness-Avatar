import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

function buildAvatarHtml() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html, body { margin: 0; padding: 0; background: #10241e; overflow: hidden; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top, rgba(94, 204, 161, 0.16), transparent 34%),
          linear-gradient(180deg, #173b31 0%, #10241e 100%);
      }
      #wrap {
        position: fixed;
        inset: 0;
      }
      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
      .caption {
        position: absolute;
        left: 16px;
        right: 16px;
        bottom: 16px;
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(12, 26, 22, 0.7);
        color: #d7eee6;
        font-size: 13px;
        line-height: 1.4;
        text-align: center;
        backdrop-filter: blur(12px);
      }
    </style>
  </head>
  <body>
    <div id="wrap">
      <canvas id="scene"></canvas>
      <div class="caption">Mindfulness avatar ready. Ask a question and the guide will answer out loud.</div>
    </div>

    <script type="module">
      import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

      const post = (type, payload = {}) => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
        }
      };

      const canvas = document.getElementById("scene");
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x10241e, 0.045);

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.75, 5.8);

      const ambient = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0xfff7ef, 2.4);
      key.position.set(2.4, 4, 3.4);
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x7fe0ba, 1.5);
      rim.position.set(-3, 1.8, 1.2);
      scene.add(rim);

      const fill = new THREE.PointLight(0x7fd2ff, 0.7, 12);
      fill.position.set(0, -0.2, 3);
      scene.add(fill);

      const avatar = new THREE.Group();
      scene.add(avatar);

      const shoulder = new THREE.Mesh(
        new THREE.CapsuleGeometry(1.1, 0.8, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x214f43, roughness: 0.7, metalness: 0.05 })
      );
      shoulder.position.set(0, -1.8, 0);
      avatar.add(shoulder);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, 0.48, 24),
        new THREE.MeshStandardMaterial({ color: 0xe7c4aa, roughness: 0.95 })
      );
      neck.position.set(0, -0.92, 0.1);
      avatar.add(neck);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(1.02, 64, 64),
        new THREE.MeshStandardMaterial({ color: 0xf1d3bb, roughness: 0.94, metalness: 0.02 })
      );
      head.scale.set(1.02, 1.12, 0.98);
      head.position.set(0, 0.2, 0);
      avatar.add(head);

      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.62),
        new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.8, metalness: 0.05 })
      );
      hair.position.set(0, 0.44, -0.05);
      avatar.add(hair);

      const browMaterial = new THREE.MeshStandardMaterial({ color: 0x2f2418, roughness: 0.9 });
      const browGeometry = new THREE.BoxGeometry(0.42, 0.06, 0.06);
      const leftBrow = new THREE.Mesh(browGeometry, browMaterial);
      const rightBrow = new THREE.Mesh(browGeometry, browMaterial);
      leftBrow.position.set(-0.32, 0.44, 0.9);
      rightBrow.position.set(0.32, 0.44, 0.9);
      leftBrow.rotation.z = -0.14;
      rightBrow.rotation.z = 0.14;
      avatar.add(leftBrow, rightBrow);

      const eyeGroup = new THREE.Group();
      avatar.add(eyeGroup);

      const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: 0xfefefe, roughness: 0.2 });
      const irisMaterial = new THREE.MeshStandardMaterial({ color: 0x173b31, roughness: 0.3 });
      const lidMaterial = new THREE.MeshStandardMaterial({ color: 0xf1d3bb, roughness: 0.9 });

      function createEye(x) {
        const group = new THREE.Group();
        group.position.set(x, 0.14, 0.86);

        const white = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), eyeWhiteMaterial);
        white.scale.set(1.25, 0.82, 0.65);
        group.add(white);

        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), irisMaterial);
        iris.position.set(0, -0.01, 0.14);
        group.add(iris);

        const lid = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), lidMaterial);
        lid.position.set(0, 0.13, 0.16);
        group.add(lid);

        return { group, lid, iris };
      }

      const leftEye = createEye(-0.34);
      const rightEye = createEye(0.34);
      eyeGroup.add(leftEye.group, rightEye.group);

      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.34, 20),
        new THREE.MeshStandardMaterial({ color: 0xe1b89c, roughness: 0.95 })
      );
      nose.position.set(0, -0.08, 0.98);
      nose.rotation.x = Math.PI * 0.5;
      avatar.add(nose);

      const mouthWrap = new THREE.Group();
      mouthWrap.position.set(0, -0.54, 0.98);
      avatar.add(mouthWrap);

      const mouth = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.34, 6, 18),
        new THREE.MeshStandardMaterial({ color: 0x4a1414, roughness: 0.45, metalness: 0.02 })
      );
      mouth.rotation.z = Math.PI * 0.5;
      mouth.scale.set(1, 0.2, 1);
      mouthWrap.add(mouth);

      const lip = new THREE.Mesh(
        new THREE.TorusGeometry(0.21, 0.028, 12, 34, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xc47271, roughness: 0.65 })
      );
      lip.rotation.x = Math.PI * 0.92;
      lip.position.set(0, 0.03, 0.02);
      mouthWrap.add(lip);

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.55, 64),
        new THREE.MeshBasicMaterial({ color: 0x0b1512, transparent: true, opacity: 0.18 })
      );
      shadow.rotation.x = -Math.PI * 0.5;
      shadow.position.set(0, -2.5, 0);
      scene.add(shadow);

      function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      window.addEventListener("resize", resize);
      resize();

      let blinkTimer = 0;
      let nextBlink = 2 + Math.random() * 2.5;
      let blinkValue = 0;
      let blinkDirection = 0;

      let mouthOpen = 0;
      let mouthWide = 1;
      let speechTimeline = [];
      let speechStartedAt = 0;
      let speechActive = false;
      let idleBounce = 0;
      let releaseTimeout = null;

      const visemes = {
        sil: { open: 0.06, wide: 1.0 },
        PP: { open: 0.04, wide: 0.8 },
        FF: { open: 0.14, wide: 1.0 },
        TH: { open: 0.18, wide: 1.02 },
        DD: { open: 0.28, wide: 1.0 },
        kk: { open: 0.25, wide: 0.94 },
        CH: { open: 0.2, wide: 0.96 },
        SS: { open: 0.1, wide: 1.08 },
        nn: { open: 0.18, wide: 0.92 },
        RR: { open: 0.22, wide: 0.98 },
        aa: { open: 0.62, wide: 1.08 },
        E: { open: 0.34, wide: 1.18 },
        I: { open: 0.2, wide: 1.14 },
        O: { open: 0.5, wide: 0.92 },
        U: { open: 0.18, wide: 0.84 }
      };

      const letterMap = {
        a: "aa", b: "PP", c: "kk", d: "DD", e: "E", f: "FF", g: "kk", h: "nn", i: "I",
        j: "CH", k: "kk", l: "nn", m: "PP", n: "nn", o: "O", p: "PP", q: "kk", r: "RR",
        s: "SS", t: "DD", u: "U", v: "FF", w: "U", x: "kk", y: "I", z: "SS"
      };

      function buildTimeline(text) {
        const timeline = [];
        let cursor = 0;
        const cleaned = text.toLowerCase().replace(/[^a-z ]/g, "");
        for (const char of cleaned) {
          if (char === " ") {
            timeline.push({ viseme: "sil", start: cursor, duration: 0.08 });
            cursor += 0.08;
            continue;
          }
          timeline.push({
            viseme: letterMap[char] || "sil",
            start: cursor,
            duration: 0.084
          });
          cursor += 0.084;
        }
        return timeline;
      }

      function resetSpeechRelease(seconds) {
        if (releaseTimeout) {
          clearTimeout(releaseTimeout);
        }
        releaseTimeout = setTimeout(() => {
          speechActive = false;
          speechTimeline = [];
          post("idle");
        }, seconds * 1000);
      }

      function animateSpeech(text) {
        speechTimeline = buildTimeline(text);
        speechStartedAt = performance.now() / 1000;
        speechActive = true;
        post("speaking");
        resetSpeechRelease(Math.max(1.1, text.length * 0.075));
      }

      function speak(text) {
        const trimmed = String(text || "").trim();
        if (!trimmed) {
          return;
        }

        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }

        animateSpeech(trimmed);

        if (!("speechSynthesis" in window)) {
          return;
        }

        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => {
          speechActive = false;
          speechTimeline = [];
          post("idle");
        };
        utterance.onerror = () => {
          speechActive = false;
          speechTimeline = [];
          post("error");
        };
        window.speechSynthesis.speak(utterance);
      }

      window.avatarSpeak = speak;

      const clock = new THREE.Clock();

      function updateBlink(delta) {
        blinkTimer += delta;
        if (blinkDirection === 0 && blinkTimer >= nextBlink) {
          blinkDirection = 1;
          blinkTimer = 0;
        }

        if (blinkDirection === 1) {
          blinkValue = Math.min(1, blinkValue + delta * 15);
          if (blinkValue >= 1) {
            blinkDirection = -1;
          }
        } else if (blinkDirection === -1) {
          blinkValue = Math.max(0, blinkValue - delta * 10);
          if (blinkValue <= 0) {
            blinkDirection = 0;
            nextBlink = 2 + Math.random() * 2.5;
          }
        }

        const lidScale = 1 - blinkValue * 0.92;
        leftEye.group.scale.y = Math.max(0.08, lidScale);
        rightEye.group.scale.y = Math.max(0.08, lidScale);
      }

      function updateSpeech() {
        let target = visemes.sil;
        if (speechActive) {
          const elapsed = performance.now() / 1000 - speechStartedAt;
          for (const frame of speechTimeline) {
            if (elapsed >= frame.start && elapsed < frame.start + frame.duration) {
              target = visemes[frame.viseme] || visemes.sil;
              break;
            }
          }
        }

        mouthOpen += (target.open - mouthOpen) * 0.22;
        mouthWide += (target.wide - mouthWide) * 0.18;

        mouth.scale.y = Math.max(0.18, mouthOpen * 2.6);
        mouth.scale.x = mouthWide;
        lip.scale.x = 0.9 + mouthWide * 0.18;
        lip.scale.y = 0.7 + mouthOpen * 0.7;
        mouthWrap.rotation.x = mouthOpen * 0.22;
      }

      function tick() {
        requestAnimationFrame(tick);
        const delta = Math.min(clock.getDelta(), 0.05);
        idleBounce += delta;

        updateBlink(delta);
        updateSpeech();

        avatar.position.y = Math.sin(idleBounce * 1.8) * 0.04;
        avatar.rotation.y = Math.sin(idleBounce * 0.7) * 0.08;
        leftEye.iris.position.x = Math.sin(idleBounce * 0.9) * 0.012;
        rightEye.iris.position.x = Math.sin(idleBounce * 0.9) * 0.012;

        renderer.render(scene, camera);
      }

      tick();
      post("ready");
    </script>
  </body>
  </html>`;
}

export default function AvatarStage({ speechText, onStatusChange }) {
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const html = useMemo(() => buildAvatarHtml(), []);

  useEffect(() => {
    if (!speechText || !isReady || !webViewRef.current) {
      return;
    }

    const escaped = JSON.stringify(speechText);
    webViewRef.current.injectJavaScript(`window.avatarSpeak(${escaped}); true;`);
  }, [isReady, speechText]);

  function handleMessage(event) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === "ready") {
        setIsReady(true);
      }
      onStatusChange?.(payload.type || "ready");
    } catch (error) {
      onStatusChange?.("error");
    }
  }

  return (
    <View style={styles.stageWrap}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
        onMessage={handleMessage}
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        style={styles.webview}
      />
      {!isReady ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stageWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#10241e"
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent"
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(16, 36, 30, 0.25)"
  }
});
