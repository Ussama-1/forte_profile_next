import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SignIn from "./Signin";

function page() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  return (
    <div>
      <SignIn callbackUrl={callbackUrl} />
    </div>
  );
}

export default page;
