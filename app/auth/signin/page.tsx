"use client";
import React from "react";
import SignIn from "./Signin";

function page() {
  const callbackUrl = "/dashboard";
  return (
    <div>
      <SignIn callbackUrl={callbackUrl} />  
    </div>
  );
}

export default page;
