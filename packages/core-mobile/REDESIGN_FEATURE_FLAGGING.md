# Feature Flagging Core Mobile Redesign

To facilitate the creation of new screens for the redesign with K2 Alpine components, we need to make these screens available inside the current application without showing them by default.

To accomplish this, we should add a toggle switch inside the Advanced settings (K2 Alpine mode or V2 mode). This switch is hidden behind a feature flag. The flag is either controlled by Posthog for the feature to be available to all devs and QAs or with a simple environment variable for now.

The actual switch will be done by verifying that the switch was turned on (as a state) and that the feature flag is turned on.

Because the new and old interfaces will have visual differences that go beyond the content of the screens, it is best to keep the entry point to the redesigned version at the very top of the app structure before rendering any visual component. This means we need to keep a second version of every layer of the application.

We will not create a second directory structure because we want to easily share the business logic and data from one version to another. The files will, therefore, live alongside one another. To differentiate both, it will be important to either prefix one version or the two of them. We will later remove the prefix once we permanently move to the newest version.

Sometimes, a screen will no longer exist in its current form. Its information was merged with another screen or moved to another section. Although it does not feel like both files could be in the same directory, it should be possible most of the time because the screens are classified in a very semantic way. If not, the files should be in parent directories, not multiple ancestors and descendants, and never siblings.
