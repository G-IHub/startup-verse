import React from "react";
import StartupVerseLogo from "../brand/StartupVerseLogo";
import { AUTH_FEATURES } from "./authFeatures";
import { useAuthCarousel } from "./useAuthCarousel";

const fadeTransition = "transition-opacity duration-[2000ms] ease-in-out";

function fadeClass(isActive, isExiting) {
  if (isActive && !isExiting) {
    return `opacity-100 ${fadeTransition}`;
  }
  if (isActive && isExiting) {
    return `opacity-0 ${fadeTransition}`;
  }
  return "opacity-0 transition-none";
}

export default function AuthMarketingPanel({
  features = AUTH_FEATURES,
  breakpoint = "md",
}) {
  const { currentSlide, isExiting, goToSlide } = useAuthCarousel(features.length);
  const hiddenClass = breakpoint === "lg" ? "hidden lg:flex" : "hidden md:flex";
  const widthClass = breakpoint === "lg" ? "lg:w-[42%]" : "md:w-[42%]";

  return (
    <div
      className={`${hiddenClass} ${widthClass} relative shrink-0 min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-primary`}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-20 top-1/4 h-16 w-16 rounded-full bg-white" />
        <div className="absolute bottom-1/3 right-32 h-12 w-12 rounded-full bg-white" />
        <div className="absolute right-16 top-1/3 h-8 w-8 rounded-full bg-white" />
      </div>
      <div className="relative z-10 flex w-full flex-col items-center justify-start px-6 py-10 text-white sm:px-8 lg:px-10 lg:py-12">
        <div className={`absolute top-8 ${breakpoint === "lg" ? "left-10" : "left-8"}`}>
          <StartupVerseLogo className="h-7 lg:h-8" />
        </div>
        <h1 className="mb-10 mt-12 text-center font-heading text-2xl font-bold tracking-tight text-white lg:mb-14 lg:mt-14 lg:text-3xl">
          Welcome!
        </h1>
        <div className="relative mb-6 h-28 w-full max-w-[min(100%,20rem)] overflow-hidden sm:mb-8 sm:h-32">
          {features.map((feature, index) => {
            const isActive = currentSlide === index;
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`absolute inset-0 flex items-center justify-center ${fadeClass(isActive, isExiting)}`}
              >
                <Icon
                  className="h-20 w-20 text-white drop-shadow-md sm:h-24 sm:w-24 lg:h-28 lg:w-28"
                  strokeWidth={1.35}
                  aria-hidden
                />
              </div>
            );
          })}
        </div>
        <div
          className="relative mb-8 w-full max-w-[min(100%,20rem)] overflow-hidden text-center lg:mb-10"
          style={{ minHeight: "120px" }}
        >
          {features.map((feature, index) => {
            const isActive = currentSlide === index;
            return (
              <div
                key={`text-${feature.title}`}
                className={`absolute inset-0 ${fadeClass(isActive, isExiting)}`}
              >
                <h2 className="mb-2 font-heading text-lg font-semibold tracking-tight text-white lg:mb-3 lg:text-xl">
                  {feature.title}
                </h2>
                <p className="mx-auto px-2 text-balance text-xs leading-relaxed text-white/90 lg:text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pb-4">
          {features.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 ${
                currentSlide === index ? "h-2 w-8 bg-white" : "h-2 w-2 bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
