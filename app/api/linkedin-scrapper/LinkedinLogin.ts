import { Page, KeyInput } from "puppeteer";

interface BiometricProfile {
  readonly dwellTime: number;
  readonly flightTime: number;
  readonly typingRhythm: number[];
  readonly pressureVariation: number;
  readonly keyHoldDuration: [number, number];
}

interface MouseBehaviorProfile {
  readonly movementStyle: "smooth" | "jittery" | "deliberate";
  readonly clickDelay: [number, number];
  readonly doubleClickProbability: number;
  readonly dragProbability: number;
  readonly scrollPattern: number[];
}

interface HumanBehaviorSimulator {
  readonly biometric: BiometricProfile;
  readonly mouse: MouseBehaviorProfile;
  readonly sessionId: string;
  readonly startTime: number;
}

interface TypingMetrics {
  readonly keystroke: string;
  readonly timestamp: number;
  readonly dwellTime: number;
  readonly flightTime: number;
}

interface DetectionCountermeasures {
  webdriverMasking: boolean;
  canvasFingerprinting: boolean;
  timingAttackPrevention: boolean;
  behavioralMimicry: boolean;
}

const createBiometricProfile = (): BiometricProfile => {
  const baseRhythm = 120 + Math.random() * 80;
  const variance = 0.3 + Math.random() * 0.4;

  return {
    dwellTime: 80 + Math.random() * 60,
    flightTime: 50 + Math.random() * 40,
    typingRhythm: Array.from(
      { length: 10 },
      () => baseRhythm * (1 + (Math.random() - 0.5) * variance)
    ),
    pressureVariation: 0.1 + Math.random() * 0.3,
    keyHoldDuration: [60 + Math.random() * 30, 120 + Math.random() * 50],
  };
};

const createMouseProfile = (): MouseBehaviorProfile => ({
  movementStyle: (["smooth", "jittery", "deliberate"] as const)[
    Math.floor(Math.random() * 3)
  ],
  clickDelay: [80 + Math.random() * 40, 150 + Math.random() * 80],
  doubleClickProbability: 0.02 + Math.random() * 0.03,
  dragProbability: 0.05 + Math.random() * 0.05,
  scrollPattern: Array.from({ length: 5 }, () => Math.random() * 200 - 100),
});

const generateSessionFingerprint = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
};

const createHumanSimulator = (): HumanBehaviorSimulator => ({
  biometric: createBiometricProfile(),
  mouse: createMouseProfile(),
  sessionId: generateSessionFingerprint(),
  startTime: Date.now(),
});

const advancedWebDriverMasking = async (page: Page): Promise<void> => {
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver traces
    const descriptors = Object.getOwnPropertyDescriptors(Navigator.prototype);
    const newDescriptors = { ...descriptors } as {
      webdriver?: PropertyDescriptor;
    };
    delete newDescriptors.webdriver;
    Object.defineProperties(navigator, newDescriptors);

    // Override navigator properties
    Object.defineProperty(navigator, "webdriver", {
      get: (): undefined => undefined,
      configurable: true,
    });

    // Mask automation indicators
    Object.defineProperty(navigator, "permissions", {
      get: () => ({
        query: async (params) => ({
          state: params.name === "notifications" ? "denied" : "granted",
        }),
      }),
    });

    // Remove Chrome automation extensions
    if (window.chrome) {
      window.chrome.runtime = undefined;
    }

    // Override plugin detection
    Object.defineProperty(navigator, "plugins", {
      get: () =>
        new Array(5).fill(null).map((_, i) => ({
          name: `Plugin ${i}`,
          description: `Description ${i}`,
          filename: `plugin${i}.dll`,
          length: Math.floor(Math.random() * 10),
        })),
    });

    // Mask language detection
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en", "es"],
    });

    // Override connection detection
    Object.defineProperty(navigator, "connection", {
      get: () => ({
        effectiveType: "4g",
        rtt: 50 + Math.random() * 50,
        downlink: 10 + Math.random() * 10,
      }),
    });

    // Remove automation variables
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    delete (window as any).callPhantom;
    delete (window as any)._phantom;
    delete (window as any).phantom;
    // Canvas fingerprinting countermeasures
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    // @ts-ignore
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: any[]
    ) {
      // Ensure the arguments match the expected signature: [contextId: string, options?: any]
      const contextId = args[0];
      const options = args[1];
      const context = originalGetContext.call(this, contextId, options);
      if (context && contextId === "2d") {
        const originalGetImageData = (context as CanvasRenderingContext2D)
          .getImageData;
        (context as CanvasRenderingContext2D).getImageData = function (
          sx: number,
          sy: number,
          sw: number,
          sh: number,
          settings?: ImageDataSettings
        ) {
          const imageData = originalGetImageData.call(
            this,
            sx,
            sy,
            sw,
            sh,
            settings
          );
          // Add subtle noise to prevent fingerprinting
          for (let i = 0; i < imageData.data.length; i += 4) {
            if (Math.random() < 0.01) {
              imageData.data[i] = Math.min(
                255,
                imageData.data[i] + Math.floor(Math.random() * 3 - 1)
              );
            }
          }
          return imageData;
        };
      }
      return context;
    };

    // Audio context fingerprinting
    const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function (this: AudioContext) {
      const analyser = originalCreateAnalyser.call(this);
      const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
      analyser.getFloatFrequencyData = function (
        array: Float32Array<ArrayBuffer>
      ) {
        originalGetFloatFrequencyData.apply(this, [array]);
        for (let i = 0; i < array.length; i++) {
          array[i] += Math.random() * 0.0001 - 0.00005;
        }
      };
      return analyser;
    };

    // WebGL fingerprinting countermeasures
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (
      this: WebGLRenderingContext,
      parameter: GLenum
    ) {
      const result = originalGetParameter.call(this, parameter);
      if (parameter === this.RENDERER || parameter === this.VENDOR) {
        return "Generic GPU Vendor";
      }
      return result;
    };
  });
};

const implementTimingCountermeasures = async (page: Page): Promise<void> => {
  await page.evaluateOnNewDocument(() => {
    // Performance timing obfuscation
    const originalNow = Performance.prototype.now;
    Performance.prototype.now = function (this: Performance) {
      return originalNow.call(this) + Math.random() * 0.1;
    };

    // Date timing obfuscation
    const originalGetTime = Date.prototype.getTime;
    Date.prototype.getTime = function (this: Date) {
      return originalGetTime.call(this) + Math.floor(Math.random() * 2);
    };

    // High-resolution time countermeasures
    if ("timeOrigin" in performance) {
      Object.defineProperty(performance, "timeOrigin", {
        get: () => Date.now() - performance.now(),
      });
    }
  });
};

const generateRealisticUserAgent = (): string => {
  const versions = ["120", "121", "122", "123"];
  const version = versions[Math.floor(Math.random() * versions.length)];
  const patch = Math.floor(Math.random() * 10);

  return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.${patch} Safari/537.36`;
};

const calculateBezierPoint = (
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number => {
  const u = 1 - t;
  return (
    u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
  );
};

const generateHumanMousePath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number
): Array<{ x: number; y: number }> => {
  const path: Array<{ x: number; y: number }> = [];
  const cp1x = startX + (endX - startX) * 0.25 + (Math.random() - 0.5) * 100;
  const cp1y = startY + (endY - startY) * 0.25 + (Math.random() - 0.5) * 100;
  const cp2x = startX + (endX - startX) * 0.75 + (Math.random() - 0.5) * 100;
  const cp2y = startY + (endY - startY) * 0.75 + (Math.random() - 0.5) * 100;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = calculateBezierPoint(t, startX, cp1x, cp2x, endX);
    const y = calculateBezierPoint(t, startY, cp1y, cp2y, endY);
    path.push({ x: Math.round(x), y: Math.round(y) });
  }

  return path;
};

const humanMouseMovement = async (
  page: Page,
  targetX: number,
  targetY: number,
  simulator: HumanBehaviorSimulator
): Promise<void> => {
  const currentMouse = await page.evaluate(() => ({ x: 0, y: 0 }));
  const steps = 15 + Math.floor(Math.random() * 10);
  const path = generateHumanMousePath(
    currentMouse.x,
    currentMouse.y,
    targetX,
    targetY,
    steps
  );

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const delay =
      simulator.mouse.movementStyle === "smooth"
        ? 8 + Math.random() * 4
        : simulator.mouse.movementStyle === "jittery"
        ? 12 + Math.random() * 8
        : 6 + Math.random() * 3;

    await page.mouse.move(point.x, point.y);
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (Math.random() < 0.1) {
      await new Promise((resolve) =>
        setTimeout(resolve, 50 + Math.random() * 100)
      );
    }
  }
};

const simulateKeystrokeDynamics = async (
  page: Page,
  character: string,
  simulator: HumanBehaviorSimulator,
  previousMetrics?: TypingMetrics
): Promise<TypingMetrics> => {
  const now = Date.now();
  const rhythmIndex =
    character.charCodeAt(0) % simulator.biometric.typingRhythm.length;
  const baseDelay = simulator.biometric.typingRhythm[rhythmIndex];

  const dwellTime =
    simulator.biometric.dwellTime *
    (1 + (Math.random() - 0.5) * simulator.biometric.pressureVariation);
  const flightTime = previousMetrics
    ? baseDelay * (1 + (Math.random() - 0.5) * 0.3)
    : simulator.biometric.flightTime;

  if (previousMetrics) {
    await new Promise((resolve) => setTimeout(resolve, flightTime));
  }

  await page.keyboard.down(character as KeyInput);
  await new Promise((resolve) => setTimeout(resolve, dwellTime));
  await page.keyboard.up(character as KeyInput);

  return {
    keystroke: character,
    timestamp: now,
    dwellTime,
    flightTime,
  };
};

const advancedHumanTyping = async (
  page: Page,
  selector: string,
  text: string,
  simulator: HumanBehaviorSimulator
): Promise<void> => {
  const element = await page.waitForSelector(selector, { timeout: 15000 });
  if (!element) throw new Error(`Element not found: ${selector}`);

  const boundingBox = await element.boundingBox();
  if (!boundingBox) throw new Error(`Cannot get bounding box for: ${selector}`);

  const centerX =
    boundingBox.x + boundingBox.width / 2 + (Math.random() - 0.5) * 20;
  const centerY =
    boundingBox.y + boundingBox.height / 2 + (Math.random() - 0.5) * 10;

  await humanMouseMovement(page, centerX, centerY, simulator);
  await new Promise((resolve) =>
    setTimeout(
      resolve,
      simulator.mouse.clickDelay[0] +
        Math.random() * simulator.mouse.clickDelay[1]
    )
  );

  await page.mouse.click(centerX, centerY);
  await new Promise((resolve) =>
    setTimeout(resolve, 100 + Math.random() * 100)
  );

  await element.evaluate((el: Element) => {
    (el as HTMLInputElement).value = "";
    (el as HTMLInputElement).focus();
  });

  let previousMetrics: TypingMetrics | undefined;
  let typedText = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Simulate human hesitation
    if (Math.random() < 0.08) {
      await new Promise((resolve) =>
        setTimeout(resolve, 200 + Math.random() * 800)
      );

      if (Math.random() < 0.3) {
        const scrollAmount =
          simulator.mouse.scrollPattern[
            Math.floor(Math.random() * simulator.mouse.scrollPattern.length)
          ];
        await page.mouse.wheel({ deltaY: scrollAmount });
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 200)
        );
      }
    }

    // Simulate typing errors
    if (Math.random() < 0.06 && typedText.length > 0) {
      const wrongChar = String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
      );
      previousMetrics = await simulateKeystrokeDynamics(
        page,
        wrongChar,
        simulator,
        previousMetrics
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 50 + Math.random() * 100)
      );

      await page.keyboard.press("Backspace");
      await new Promise((resolve) =>
        setTimeout(resolve, 80 + Math.random() * 120)
      );
    }

    // Simulate double-typing
    if (Math.random() < 0.03) {
      previousMetrics = await simulateKeystrokeDynamics(
        page,
        char,
        simulator,
        previousMetrics
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 30 + Math.random() * 50)
      );
      await page.keyboard.press("Backspace");
      await new Promise((resolve) =>
        setTimeout(resolve, 60 + Math.random() * 100)
      );
    }

    previousMetrics = await simulateKeystrokeDynamics(
      page,
      char,
      simulator,
      previousMetrics
    );
    typedText += char;

    // Random micro-pauses
    if (Math.random() < 0.05) {
      await new Promise((resolve) =>
        setTimeout(resolve, 50 + Math.random() * 150)
      );
    }
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 200 + Math.random() * 300)
  );
};

const simulateNaturalBrowsingSession = async (
  page: Page,
  simulator: HumanBehaviorSimulator
): Promise<void> => {
  const actions = [
    async (): Promise<void> => {
      const x = Math.random() * 800 + 100;
      const y = Math.random() * 600 + 100;
      await humanMouseMovement(page, x, y, simulator);
    },
    async (): Promise<void> => {
      const scrollAmount =
        simulator.mouse.scrollPattern[
          Math.floor(Math.random() * simulator.mouse.scrollPattern.length)
        ];
      await page.mouse.wheel({ deltaY: scrollAmount });
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 300)
      );
    },
    async (): Promise<void> => {
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 1500)
      );
    },
    async (): Promise<void> => {
      await page.keyboard.press("Tab");
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 200)
      );
    },
  ];

  const numActions = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numActions; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    await action();
  }
};

const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

export const loginToLinkedInHelper = async (page: Page): Promise<void> => {
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    throw new Error("LinkedIn credentials not found in environment variables");
  }

  const simulator = createHumanSimulator();
  const countermeasures: DetectionCountermeasures = {
    webdriverMasking: true,
    canvasFingerprinting: true,
    timingAttackPrevention: true,
    behavioralMimicry: true,
  };

  try {
    console.log(`🚀 Initializing stealth session: ${simulator.sessionId}`);

    // Apply all countermeasures
    if (countermeasures.webdriverMasking) {
      await advancedWebDriverMasking(page);
    }

    if (countermeasures.timingAttackPrevention) {
      await implementTimingCountermeasures(page);
    }

    // Set realistic browser configuration
    await page.setUserAgent(generateRealisticUserAgent());
    await page.setViewport({
      width: 1366 + Math.floor(Math.random() * 200),
      height: 768 + Math.floor(Math.random() * 200),
      deviceScaleFactor: 1 + Math.random() * 0.5,
    });

    // Set realistic headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    });

    console.log("🔍 Establishing natural browsing session");

    // Visit LinkedIn homepage first to establish session
    await page.goto("https://www.linkedin.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await randomDelay(3000, 6000);
    await simulateNaturalBrowsingSession(page, simulator);

    // Navigate to login page naturally
    console.log("🔑 Navigating to login page");
    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await randomDelay(2000, 5000);
    await simulateNaturalBrowsingSession(page, simulator);

    // Wait for login form
    await page.waitForSelector("#username", { timeout: 15000 });
    await randomDelay(1000, 3000);

    console.log("⌨️  Entering credentials with biometric simulation");

    // Enter email with advanced human simulation
    await advancedHumanTyping(page, "#username", email, simulator);
    await randomDelay(1500, 3500);
    await simulateNaturalBrowsingSession(page, simulator);

    // Enter password with advanced human simulation
    await advancedHumanTyping(page, "#password", password, simulator);
    await randomDelay(2000, 4000);

    // Simulate pre-click behavior
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error("Submit button not found");
    }

    const submitBox = await submitButton.boundingBox();
    if (!submitBox) {
      throw new Error("Cannot get submit button bounding box");
    }

    const submitX =
      submitBox.x + submitBox.width / 2 + (Math.random() - 0.5) * 40;
    const submitY =
      submitBox.y + submitBox.height / 2 + (Math.random() - 0.5) * 20;

    await humanMouseMovement(page, submitX, submitY, simulator);
    await randomDelay(800, 1500);

    // Simulate hover behavior
    await page.hover('button[type="submit"]');
    await randomDelay(200, 500);

    console.log("🚀 Submitting login form");

    // Click and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page
        .waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 35000,
        })
        .catch(() => {}),
    ]);

    // Extended wait for post-login processing
    await randomDelay(6000, 12000);

    // Comprehensive login verification
    const isLoggedIn = await page.evaluate(() => {
      const indicators = [
        'a[href*="/in/"]',
        'a[href*="/profile/"]',
        ".global-nav__me",
        '[data-test-icon="nav-messages-icon"]',
        '[data-test-icon="nav-notifications-icon"]',
        ".feed-identity-module",
        ".scaffold-layout__main",
        '[data-test-app-aware-link="home"]',
      ];

      return indicators.some((selector) => document.querySelector(selector));
    });

    if (!isLoggedIn) {
      // Enhanced error detection
      const detectionChecks = [
        {
          selector:
            'iframe[src*="captcha"], [id*="captcha"], [class*="captcha"]',
          error: "CAPTCHA detected",
        },
        {
          selector:
            '[data-test-id="challenge"], [class*="challenge"], [id*="verification"]',
          error: "Verification challenge detected",
        },
        {
          selector: ".alert-error, .error-message, .form__label--error",
          error: "Authentication error",
        },
        {
          selector: '[data-test-id="blocked"]',
          error: "Account temporarily blocked",
        },
        {
          selector: '[class*="security-challenge"]',
          error: "Security challenge required",
        },
      ];

      for (const check of detectionChecks) {
        const element = await page.$(check.selector);
        if (element) {
          const errorText = await page.evaluate(
            (el: Element) => el.textContent?.trim() || "",
            element
          );
          throw new Error(`${check.error}: ${errorText}`);
        }
      }

      throw new Error("Login verification failed - unknown error");
    }

    console.log(`✅ Login successful for session: ${simulator.sessionId}`);
    console.log(
      `📊 Session metrics: ${Date.now() - simulator.startTime}ms total duration`
    );

    // Post-login natural behavior
    await randomDelay(3000, 6000);
    await simulateNaturalBrowsingSession(page, simulator);
  } catch (error) {
    console.error(`❌ Login failed for session: ${simulator.sessionId}`);

    await page
      .screenshot({
        path: `login_error_${simulator.sessionId}.png`,
        fullPage: true,
      })
      .catch(() => {});

    throw new Error(
      `Authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
