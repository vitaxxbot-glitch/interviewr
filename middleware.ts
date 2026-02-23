import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes — no auth needed (interviewees + health)
const isPublicRoute = createRouteMatcher([
  '/interview(.*)',
  '/api/interviews/:id(.*)',   // all interview API calls (GET, POST, chat)
  '/api/transcribe(.*)',
  '/api/health(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
