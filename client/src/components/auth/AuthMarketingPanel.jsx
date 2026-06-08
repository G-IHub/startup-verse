import React from "react";
import { Building } from "lucide-react";
import { AUTH_FEATURES } from "./authFeatures";
import { useAuthCarousel } from "./useAuthCarousel";

const slideTransition =
  "transition-all duration-[2000ms] ease-out";
const slideTransitionIn =
  "transition-all duration-[2000ms] ease-in";

function slideClass(isActive, isExiting) {
  if (isActive && !isExiting) {
    return `translate-x-0 opacity-100 ${slideTransition}`;
  }
  if (isActive && isExiting) {
    return `-translate-x-full opacity-0 ${slideTransitionIn}`;
  }
  return "translate-x-full opacity-0 transition-none";
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
      className={`${hiddenClass} ${widthClass} relative overflow-hidden bg-primary`}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-20 top-1/4 h-16 w-16 rounded-full bg-white" />
        <div className="absolute bottom-1/3 right-32 h-12 w-12 rounded-full bg-white" />
        <div className="absolute right-16 top-1/3 h-8 w-8 rounded-full bg-white" />
      </div>
      <div className="relative z-10 flex w-full flex-col items-center justify-center p-8 text-white lg:p-12">
        <div className={`absolute top-8 ${breakpoint === "lg" ? "left-10" : "left-8"}`}>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-white" aria-hidden />
            <span className="font-heading text-lg font-semibold">StartupVerse</span>
          </div>
        </div>
        <h1 className="mb-14 text-center font-heading text-3xl font-bold tracking-tight text-white lg:mb-16 lg:text-4xl">
          Welcome!
        </h1>
        <div className="relative mb-8 h-32 w-full max-w-sm overflow-hidden">
          {features.map((feature, index) => {
            const isActive = currentSlide === index;
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`absolute inset-0 flex items-center justify-center ${slideClass(isActive, isExiting)}`}
              >
                <Icon
                  className="h-24 w-24 text-white drop-shadow-md sm:h-28 sm:w-28"
                  strokeWidth={1.35}
                  aria-hidden
                />
              </div>
            );
          })}
        </div>
        <div
          className="relative mb-10 w-full max-w-md overflow-hidden text-center lg:mb-12"
          style={{ minHeight: "140px" }}
        >
          {features.map((feature, index) => {
            const isActive = currentSlide === index;
            return (
              <div
                key={`text-${feature.title}`}
                className={`absolute inset-0 ${slideClass(isActive, isExiting)}`}
              >
                <h2 className="mb-3 font-heading text-xl font-semibold tracking-tight text-white">
                  {feature.title}
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/90">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
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
