/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../app/App';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';
import AppViewModel from '../app/utils/AppViewModel';
import {TestScheduler} from 'rxjs/testing';
import {auditTime, take} from 'rxjs/operators';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toStrictEqual(expected);
});

it('renders correctly', () => {
  renderer.create(<App />);
});

it('given a color scheme "light" isDarkMode should be false', () => {
  const vm: AppViewModel = new AppViewModel('light');
  expect(vm?.isDarkMode.value).toBe(false);
});

it('given a color scheme "dark" isDarkMode should be true', () => {
  const vm: AppViewModel = new AppViewModel('dark');
  expect(vm.isDarkMode.value).toBe(true);
});

it('after at least 1s avax price should be set and positive', done => {
  const vm: AppViewModel = new AppViewModel('dark');
  vm.onComponentMount();
  //Asynchronous testing, if we're depending on Promises
  vm.avaxPrice.pipe(auditTime(1000)).subscribe(value => {
    expect(value).toBeGreaterThan(0);
    done();
  });
});

it('after initialization mnemonic should be set', () => {
  const vm: AppViewModel = new AppViewModel('dark');
  //Synchronous testing using Marble testing (https://rxjs.dev/guide/testing/marble-testing)
  testScheduler.run(helpers => {
    const {expectObservable} = helpers;
    const source = vm.mnemonic.pipe(take(1));
    expectObservable(source).toBe('(a|)', {
      a: 'enemy cabbage salute expire verb camera update like dirt arrest record hidden about warfare record fire hungry arch sting quality cliff inside flash list',
    });
  });
});
