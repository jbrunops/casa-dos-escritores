"use client";

import dynamic from "next/dynamic";

// Importar o componente de diagnóstico com dynamic para evitar SSR
const SupabaseCheck = dynamic(() => import("./SupabaseCheck"), { ssr: false });
const SimpleSupabaseTest = dynamic(() => import("./SimpleSupabaseTest"), { ssr: false });
const DirectSupabaseTest = dynamic(() => import("./DirectSupabaseTest"), { ssr: false });
const CORSTest = dynamic(() => import("./CORSTest"), { ssr: false });
const NetworkCheck = dynamic(() => import("./NetworkCheck"), { ssr: false });

export default function SupabaseWrapper() {
  return (
    <div>
      <SupabaseCheck />
      <NetworkCheck />
      <CORSTest />
      <DirectSupabaseTest />
      <SimpleSupabaseTest />
    </div>
  );
} 