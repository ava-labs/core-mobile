const LENGTH_SHORT = 2000;
const LENGTH_LONG = 5000;

export function ShowSnackBar(text: string, long = false) {
  // provided by `global`. See ContextApp.tsx and index.d.ts at the root of the project.
  toast.show(text, {
    type: 'normal',
    placement: 'bottom',
    duration: long ? LENGTH_LONG : LENGTH_SHORT,
    animationType: 'slide-in',
  });
}
