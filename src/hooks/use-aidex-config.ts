import { useEffect, useState } from "react";
import { loadConfig, subscribeConfig, AidexConfig } from "@/lib/aidexConfig";

export function useAidexConfig(): AidexConfig {
  const [cfg, setCfg] = useState<AidexConfig>(() => loadConfig());
  useEffect(() => subscribeConfig(() => setCfg(loadConfig())), []);
  return cfg;
}
