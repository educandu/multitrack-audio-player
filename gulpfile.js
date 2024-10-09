import gulp from 'gulp';
import { deleteAsync } from 'del';
import Graceful from 'node-graceful';
import {
  cliArgs,
  createGithubRelease,
  createLabelInJiraIssues,
  createReleaseNotesFromCurrentTag,
  ensureIsValidSemverTag,
  esbuild,
  eslint,
  vitest,
  less,
  NodeProcess
} from '@educandu/dev-tools';

let currentApp = null;
let isInWatchMode = false;
let currentAppBuildContext = null;

process.env.NODE_ENV ||= 'development';

Graceful.on('exit', async () => {
  await currentAppBuildContext?.dispose();
  await currentApp?.waitForExit();
});

export async function clean() {
  await deleteAsync(['coverage', 'test-app/dist']);
}

export async function lint() {
  await eslint.lint('**/*.js', { failOnError: !isInWatchMode });
}

export async function fix() {
  await eslint.fix('**/*.js');
}

export async function test() {
  await vitest.coverage();
}

export async function testWatch() {
  await vitest.watch();
}

export const build = done => done();

export async function buildTestAppCss() {
  await less.compile({
    inputFile: 'test-app/src/main.less',
    outputFile: 'test-app/dist/main.css',
    optimize: !!cliArgs.optimize
  });
}

export async function buildTestAppJs() {
  if (currentAppBuildContext) {
    await currentAppBuildContext.rebuild();
  } else {
    // eslint-disable-next-line require-atomic-updates
    currentAppBuildContext = await esbuild.bundle({
      entryPoints: ['./test-app/src/main.js'],
      outdir: './test-app/dist',
      minify: !!cliArgs.optimize,
      incremental: isInWatchMode
    });
  }
}
export function buildTestAppHtml() {
  return gulp.src('test-app/src/**/*.html', { base: 'test-app/src' }).pipe(gulp.dest('test-app/dist'));
}

export const buildTestApp = gulp.parallel(buildTestAppCss, buildTestAppJs, buildTestAppHtml);

export async function startServer() {
  currentApp = new NodeProcess({
    script: 'test-app/src/server.js',
    env: {
      ...process.env,
      PORT: 3000,
      CDN_BASE_URL: 'http://localhost:9000/dev-educandu-cdn'
    }
  });

  await currentApp.start();
}

export async function restartServer() {
  await currentApp.restart();
}

export function verifySemverTag(done) {
  ensureIsValidSemverTag(cliArgs.tag);
  done();
}

export async function release() {
  const { currentTag, releaseNotes, jiraIssueKeys } = await createReleaseNotesFromCurrentTag({
    jiraBaseUrl: cliArgs.jiraBaseUrl,
    jiraProjectKeys: cliArgs.jiraProjectKeys.split(',')
  });

  await createGithubRelease({
    githubToken: cliArgs.githubToken,
    currentTag,
    releaseNotes,
    files: []
  });

  await createLabelInJiraIssues({
    jiraBaseUrl: cliArgs.jiraBaseUrl,
    jiraUser: cliArgs.jiraUser,
    jiraApiKey: cliArgs.jiraApiKey,
    jiraIssueKeys,
    label: currentTag
  });
}

export const serve = gulp.series(build, startServer);

export const verify = gulp.series(lint, test, build);

export function setupWatchMode(done) {
  isInWatchMode = true;
  done();
}

export function startWatchers(done) {
  gulp.watch(['src/**/*', 'test-app/src/**/*'], gulp.series(buildTestApp, restartServer));
  done();
}

export const watch = gulp.series(setupWatchMode, buildTestApp, serve, startWatchers);

export default watch;
