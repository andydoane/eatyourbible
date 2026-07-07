/* =========================================================
   BibloZoo Zookeeper Profiles
   Phase 1: profile registry and per-profile storage foundation

   Exposes:
     window.BibloZooProfiles
   ========================================================= */

(function () {
  "use strict";

  const PROFILE_REGISTRY_STORAGE_KEY = "biblozooProfiles";
  const PROFILE_REGISTRY_VERSION = 1;
  const LEGACY_PROGRESS_STORAGE_KEY = "verseMemoryProgress";
  const PROFILE_NAME_MAX_LENGTH = 16;

  function cloneJson(value) {
    if (value == null) return value;

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (err) {
      return value;
    }
  }

  function normalizeWhitespace(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeProfileNameForComparison(value) {
    return normalizeWhitespace(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function getSharedNameValidationApi() {
    return window.BibloZooNameValidation || null;
  }

  function getProfileNameMaxLength() {
    const sharedMaxLength = Number(
      getSharedNameValidationApi()?.MAX_LENGTH
    );

    return Number.isFinite(sharedMaxLength) && sharedMaxLength > 0
      ? Math.floor(sharedMaxLength)
      : PROFILE_NAME_MAX_LENGTH;
  }

  function cleanProfileName(value) {
    const sharedCleaner =
      getSharedNameValidationApi()?.cleanDisplayName;

    if (typeof sharedCleaner === "function") {
      return sharedCleaner(value, getProfileNameMaxLength());
    }

    return normalizeWhitespace(value)
      .slice(0, getProfileNameMaxLength());
  }

  function validateProfileName(value, {
    excludeProfileId = ""
  } = {}) {
    const untrimmedName = normalizeWhitespace(value);
    const maxLength = getProfileNameMaxLength();

    if (!untrimmedName) {
      return {
        ok: false,
        code: "blank",
        name: "",
        message: "Please enter a Zookeeper name."
      };
    }

    if (untrimmedName.length > maxLength) {
      return {
        ok: false,
        code: "too_long",
        name: cleanProfileName(untrimmedName),
        message: `Zookeeper names can be up to ${maxLength} characters.`
      };
    }

    const cleanName = cleanProfileName(untrimmedName);
    const sharedBlockChecker =
      getSharedNameValidationApi()?.isDisplayNameBlocked;

    if (
      typeof sharedBlockChecker === "function" &&
      sharedBlockChecker(cleanName)
    ) {
      return {
        ok: false,
        code: "blocked",
        name: cleanName,
        message: "Please choose a different name."
      };
    }

    if (isProfileNameInUse(cleanName, excludeProfileId)) {
      return {
        ok: false,
        code: "duplicate",
        name: cleanName,
        message: "That Zookeeper name is already being used."
      };
    }

    return {
      ok: true,
      code: "",
      name: cleanName,
      message: ""
    };
  }

  function createEmptyProfileRegistry() {
    return {
      version: PROFILE_REGISTRY_VERSION,
      activeProfileId: "",
      profiles: []
    };
  }

  function generateProfileId() {
    try {
      if (globalThis.crypto?.randomUUID) {
        return `profile_${globalThis.crypto.randomUUID().replace(/-/g, "")}`;
      }
    } catch (err) {
      // Fall through to the compatibility generator.
    }

    const timePart = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 12);
    return `profile_${timePart}_${randomPart}`;
  }

  function normalizeProfileRecord(rawProfile, usedIds = new Set()) {
    if (!rawProfile || typeof rawProfile !== "object") return null;

    let id = String(rawProfile.id || "").trim();

    if (!id || usedIds.has(id)) {
      id = generateProfileId();

      while (usedIds.has(id)) {
        id = generateProfileId();
      }
    }

    const name = normalizeWhitespace(rawProfile.name);
    const avatarVerseId = String(rawProfile.avatarVerseId || "").trim();

    if (!name) return null;

    const now = Date.now();
    const createdAtValue = Number(rawProfile.createdAt);
    const updatedAtValue = Number(rawProfile.updatedAt);

    usedIds.add(id);

    return {
      id,
      name,
      avatarVerseId,
      createdAt: Number.isFinite(createdAtValue) && createdAtValue > 0
        ? createdAtValue
        : now,
      updatedAt: Number.isFinite(updatedAtValue) && updatedAtValue > 0
        ? updatedAtValue
        : now
    };
  }

  function normalizeProfileRegistry(rawRegistry) {
    const registry = rawRegistry && typeof rawRegistry === "object"
      ? rawRegistry
      : {};

    const usedIds = new Set();
    const profiles = Array.isArray(registry.profiles)
      ? registry.profiles
        .map(profile => normalizeProfileRecord(profile, usedIds))
        .filter(Boolean)
      : [];

    let activeProfileId = String(registry.activeProfileId || "").trim();

    if (!profiles.some(profile => profile.id === activeProfileId)) {
      activeProfileId = "";
    }

    return {
      version: PROFILE_REGISTRY_VERSION,
      activeProfileId,
      profiles
    };
  }

  function loadProfileRegistry() {
    try {
      const raw = localStorage.getItem(PROFILE_REGISTRY_STORAGE_KEY);

      if (!raw) {
        return createEmptyProfileRegistry();
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeProfileRegistry(parsed);

      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        saveProfileRegistry(normalized);
      }

      return normalized;
    } catch (err) {
      console.warn("Could not load BibloZoo profile registry", err);
      return createEmptyProfileRegistry();
    }
  }

  function saveProfileRegistry(registry) {
    const normalized = normalizeProfileRegistry(registry);

    try {
      localStorage.setItem(
        PROFILE_REGISTRY_STORAGE_KEY,
        JSON.stringify(normalized)
      );
    } catch (err) {
      console.warn("Could not save BibloZoo profile registry", err);
      throw err;
    }

    return cloneJson(normalized);
  }

  function getAllProfiles() {
    return cloneJson(loadProfileRegistry().profiles);
  }

  function hasProfiles() {
    return loadProfileRegistry().profiles.length > 0;
  }

  function getProfileById(profileId) {
    const id = String(profileId || "").trim();
    if (!id) return null;

    const profile = loadProfileRegistry().profiles.find(item => item.id === id);
    return profile ? cloneJson(profile) : null;
  }

  function getActiveProfileId() {
    return loadProfileRegistry().activeProfileId || "";
  }

  function getActiveProfile() {
    const registry = loadProfileRegistry();

    if (!registry.activeProfileId) return null;

    const profile = registry.profiles.find(
      item => item.id === registry.activeProfileId
    );

    return profile ? cloneJson(profile) : null;
  }

  function setActiveProfile(profileId) {
    const id = String(profileId || "").trim();
    const registry = loadProfileRegistry();

    if (!id) {
      registry.activeProfileId = "";
      saveProfileRegistry(registry);
      return null;
    }

    const profile = registry.profiles.find(item => item.id === id);

    if (!profile) {
      throw new Error("The selected Zookeeper profile does not exist.");
    }

    registry.activeProfileId = profile.id;
    saveProfileRegistry(registry);

    return cloneJson(profile);
  }

  function clearActiveProfile() {
    return setActiveProfile("");
  }

  function isProfileNameInUse(name, excludeProfileId = "") {
    const comparisonName = normalizeProfileNameForComparison(name);

    if (!comparisonName) return false;

    const excludedId = String(excludeProfileId || "").trim();

    return loadProfileRegistry().profiles.some(profile => {
      if (excludedId && profile.id === excludedId) return false;

      return normalizeProfileNameForComparison(profile.name) === comparisonName;
    });
  }

  function createProfile({
    name,
    avatarVerseId = "",
    makeActive = true,
    id = ""
  } = {}) {
    const validation = validateProfileName(name);

    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const cleanName = validation.name;
    const registry = loadProfileRegistry();
    const usedIds = new Set(registry.profiles.map(profile => profile.id));

    let profileId = String(id || "").trim();

    if (!profileId || usedIds.has(profileId)) {
      profileId = generateProfileId();

      while (usedIds.has(profileId)) {
        profileId = generateProfileId();
      }
    }

    const now = Date.now();
    const profile = {
      id: profileId,
      name: cleanName,
      avatarVerseId: String(avatarVerseId || "").trim(),
      createdAt: now,
      updatedAt: now
    };

    registry.profiles.push(profile);

    if (makeActive || registry.profiles.length === 1) {
      registry.activeProfileId = profile.id;
    }

    saveProfileRegistry(registry);

    return cloneJson(profile);
  }

  function updateProfile(profileId, updates = {}) {
    const id = String(profileId || "").trim();

    if (!id) {
      throw new Error("A Zookeeper profile ID is required.");
    }

    const registry = loadProfileRegistry();
    const profileIndex = registry.profiles.findIndex(profile => profile.id === id);

    if (profileIndex < 0) {
      throw new Error("The Zookeeper profile could not be found.");
    }

    const currentProfile = registry.profiles[profileIndex];
    const requestedName = Object.prototype.hasOwnProperty.call(updates, "name")
      ? updates.name
      : currentProfile.name;

    const validation = validateProfileName(requestedName, {
      excludeProfileId: id
    });

    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const nextName = validation.name;

    const nextAvatarVerseId = Object.prototype.hasOwnProperty.call(
      updates,
      "avatarVerseId"
    )
      ? String(updates.avatarVerseId || "").trim()
      : currentProfile.avatarVerseId;

    const updatedProfile = {
      ...currentProfile,
      name: nextName,
      avatarVerseId: nextAvatarVerseId,
      updatedAt: Date.now()
    };

    registry.profiles[profileIndex] = updatedProfile;
    saveProfileRegistry(registry);

    return cloneJson(updatedProfile);
  }

  function getProfileProgressStorageKey(profileId = getActiveProfileId()) {
    const id = String(profileId || "").trim();

    if (!id) return "";

    return `${LEGACY_PROGRESS_STORAGE_KEY}:${id}`;
  }

  function deleteProfile(profileId, { removeProgress = false } = {}) {
    const id = String(profileId || "").trim();

    if (!id) {
      throw new Error("A Zookeeper profile ID is required.");
    }

    const registry = loadProfileRegistry();
    const existingProfile = registry.profiles.find(profile => profile.id === id);

    if (!existingProfile) return false;

    registry.profiles = registry.profiles.filter(profile => profile.id !== id);

    if (registry.activeProfileId === id) {
      registry.activeProfileId = "";
    }

    saveProfileRegistry(registry);

    if (removeProgress) {
      const progressKey = getProfileProgressStorageKey(id);

      if (progressKey) {
        try {
          localStorage.removeItem(progressKey);
        } catch (err) {
          console.warn("Could not remove Zookeeper progress", err);
        }
      }
    }

    return true;
  }

  function profileHasSavedProgress(profileId) {
    const key = getProfileProgressStorageKey(profileId);
    if (!key) return false;

    try {
      return localStorage.getItem(key) !== null;
    } catch (err) {
      return false;
    }
  }

  function hasLegacyProgress() {
    try {
      return localStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY) !== null;
    } catch (err) {
      return false;
    }
  }

  function getLegacyProgressStorageKey() {
    return LEGACY_PROGRESS_STORAGE_KEY;
  }

  window.BibloZooProfiles = Object.freeze({
    PROFILE_REGISTRY_STORAGE_KEY,
    PROFILE_REGISTRY_VERSION,
    LEGACY_PROGRESS_STORAGE_KEY,

    createEmptyProfileRegistry,
    normalizeProfileRegistry,
    loadProfileRegistry,
    saveProfileRegistry,

    getAllProfiles,
    hasProfiles,
    getProfileById,
    getActiveProfileId,
    getActiveProfile,
    setActiveProfile,
    clearActiveProfile,

    createProfile,
    updateProfile,
    deleteProfile,
    isProfileNameInUse,

    PROFILE_NAME_MAX_LENGTH,
    cleanProfileName,
    validateProfileName,
    normalizeProfileNameForComparison,
    getProfileProgressStorageKey,
    profileHasSavedProgress,
    hasLegacyProgress,
    getLegacyProgressStorageKey
  });
})();
