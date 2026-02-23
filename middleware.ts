import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// These routes are public — no auth needed
const isPublicRoute = createRouteMatcher([
  '/interview/:id*',
  '/api/interviews/:id/chat',
  '/api/interviews/:id',
  '/api/transcribe',
  '/api/health',
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
