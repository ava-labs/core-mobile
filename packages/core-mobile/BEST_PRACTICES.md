This document contains the best practices and patterns for the Core Mobile codebase.

There are a few reasons why this document should exist:

- Serve as a guide for our software development processes by outlining best practices and patterns to follow.
- Document solutions to common problems.
- Educate new mobile engineers contributing to our codebase.
- Reduce tribal knowledge.
- Encourage new and better ways of doing things (and documenting them).

A best practice or pattern should have the following attributes:

- Improve the way we write code.
- Solve a problem(s).
- Have clear advantages over alternatives.
- Be comprehensive and consistent across a system or subsystem.
- Be non-trivial (eg. something that a lint rule can't resolve).

#### Adding to this document

The process for adding to this document is similar to the RFC process. Document your idea in a clear and concise way. Use the mark down language to help convey your idea, eg. code snippets, bullet points, headers, etc... Explain why this pattern is better than alternatives. Once you feel your idea is ready you can submit a merge request. Merging this file will require approval from all members of the guild. This ensures everyone has a chance to submit feedback as well as stay informed of changes to this document. Once you have resolved any feedback and have the requisite approvals you can merge the changes.

## Collocation
Collocation entails the practice of locating the data and UI requirements of a component in the same file as that component.

```typescript jsx
interface Props {
  user: ComponentFragment
}

const Component: FC<Props> = ({ user }) => (
  <View style={styles.container}>
    <Text>{user.name}</Text>
  </View>
);

const styles = StyleSheet.create({ // UI requirements
  container: {
    backgroundColor: 'blue',
  }
});
```
In the example above, the styles are defined in the same file as the component. This makes it convenient to modify the requirements of the component. Because each component has its own styles defined you don't have to worry about these requirements supporting any other component.

#### What about sharing styles?
The way we organize our components means there aren't many opportunities to share styles between components. The component library (or design system) defines a base set of components that take care of most UI/styling needs. If you are creating a new component outside of the component library you are likely using styling simply to glue component library components together. These component library components are the basic building blocks of our UI and will become the substrate for the data components.

Even when two components may have the same data or UI requirements those requirements may change over time. Collocation ensures that each data and UI requirement only support one component.

#### When not to Collocate
* Some components don't have any data or styling requirements. In these cases there won't be any need for collocation.
* There are times when UI requirements can be shared. We share these UI requirements through a Theme. For the UI requirements that are not shared they should be collocated with the component they will be supporting.

#### Collocation Style
It's convenient to have the code that is most likely to be edited near the top of the file. For this reason we prefer to place the component, with it's Props interface above it. The styling is next. This is depicted in the first collocation code example.

```typescript jsx
interface Props {
name: string;
age: number;
}

const MyFunctionComponent: FC<Props> ({ age, name }) => {...};

const styles = StyleSheet.create({...});
```

## Destructuring props Parameter in Function Components

Destructuring the props parameter in function components provides three main advantages.

1. Explicit types on default props
2. Precise props spread to child components
3. Cleaner syntax

This is the syntax for destructuring the props parameter in a function component.

```typescript jsx
interface Props {
  name: string;
  age: number;
}

const MyFunctionComponent: FC<Props> ({ age, name }) => {...};
```

Read on for details on each point.

### Explicit Types on Default Props

Consider the following snippet:

```typescript jsx
interface Props {
  name?: string;
  age: number;
}

const MyFunctionComponent: FC<Props> = props => {
  const { name, age } = props;
  ...
};

MyFunctionComponent.defaultProps = {
  name: 'Default Name',
};
```

Here we are defining a default value for `name` using the `defaultProps` property on `MyFunctionComponent`. When we inspect what type `name` is we find, `string | undefined`. This should not be the case as `name` will always have a value of type `string` because whenever `name` is `undefined` the default value is used. Therefore the type should be `string`.

If we set the default value in the destructured assignment of the props parameter TS is able to correctly identify the type of the default prop.

```typescript jsx
interface Props {
  name?: string;
  age: number;
}

const MyFunctionComponent: FC<Props> ({ age, name = 'Default Name' }) => {
  console.log(assert(typeof name === 'string')) // true
  ...
};
```

If we inspect the type of `name` we find it is `string` even when a name prop is not passed to MyFunctionComponent. This is what we want.

_Note that when we set a default value for a prop we need to mark that prop as optional in the interface._

### Precise props spread to children components

Consider the following code,

```typescript jsx
interface MyFCProps {
  name: string;
  age: number;
}

const MyFC: FC<MyFCProps> = ({ name, age }) => {...};

interface MYOtherFCProps extends MyFCProps {
  country: string;
}

const MyOtherFC: FC<MYOtherFCProps> = props => {
  return (
    ...
      <Text>{props.country}</Text>
      <MyFC {...props} />
    ...
  );
};
```

Here we passing the child component, `MyFC` all of the props passed into `MyOtherFC`. We only want to pass a subset of the props passed into `MyOtherFC` to `MyFC`. Destructuring assignment allows us to take advantage of the rest operator, `...rest`. The `rest` variable captures all of the properties that were not explicitly destructured into a single reference.

In the code below `MyOtherFC` is passing only `age`, and `name`, to `MyFC` instead of `age`, `name`, and `country`, like it was before.

```typescript jsx
...
const MyOtherFC: FC<MYOtherFCProps> = ({ country, ...rest }) => {
  return (
    ...
      <Text>{country}</Text>
      <MyFC {...rest}>
    ...
  );
};
```

In some cases the parent will want to reference a prop(s) from the interface of the child component. In this case the prop can be destructured and passed into the child component explicitly along with the props in `...rest`, like so.

```typescript jsx
...
const MyOtherFC: FC<MYOtherFCProps> = ({ country, age, ...rest }) => {
  return (
    <View style={{ backgroundColor: age >= 18 ? 'black' : 'red' }}>
      <MyFC {...rest} age={age} />
      <Text>{country}</Text>
    ...
  );
};
```

#### Exceptions / Edge cases

1. If the component passes through all the props there is no need for destructuring assignment, like so:

```typescript jsx
...
const Component: FC<Props> = props => {
  return (
    ...
      <ChildComponent {...props} />
    ...
  );
};
```

2. If the component passes through ALL props to child components and uses ALL props in the parent there are two options:
    1. If there are few props then destructure the props parameter and pass the props explicitly to the child component(s).
   ```typescript jsx
   const Component: FC<Props> = ({ a, b, c }) => {
     ... // using references to a, b, c
     return (
        ...
         <ChildComponent a={a} b={b} c={c} /> // explicitly passing destructured props
        ...
     );
   };
   ```
    2. If there are many props then destructure the props parameter in the function body and use `{...props}` to pass the child props.
   ```typescript jsx
   const Component: FC<Props> = props => {
     const { ... } = props;
     ... // using references to destructured props
     return (
        ...
          <ChildComponent {...props} /> // because we didn't destructure props we can reference it and use the spread operator
        ...
     );
   };
   ```

### Cleaner syntax

Take the following code:

```typescript jsx
const Component: FC<Props> = props => {
  return (
    <View style={{ backGroundColor: props.color }}>
      <Text>{props.text}</Text>
    ...
  );
};
```

Make it less redundant by pulling each prop into its own variable.

```typescript jsx
const Component: FC<Props> = props => {
  const color = props.color;
  const text = props.text;
  return (
    <View style={{ backGroundColor: color }}>
      <Text>{text}</Text>
    ...
  );
};
```

Destructure in the assignment to combine color and text in the same line.

```typescript jsx
const Component: FC<Props> = props => {
  const { color, text } = props;
  return (
    <View style={{ backGroundColor: color }}>
      <Text>{text}<Text>
    ...
  );
};
```

We can do a final step to make this even better by destructuring the props parameter and omitting the return statement because no operations are happening in the function body except returning the JSX.

```typescript jsx
const Component: FC<Props> = ({ color, text }) => (
  <View style={{ backGroundColor: color }}>
    <Text>{text}</Text>
  ...
);
```

Hence, the cleanest refactor we could do involves destructuring the props parameter.

If we want to add a default prop we don't have to go to a separate part of the file to utilize the `defaultProps` property on the function component. If we need to pass through props to children we can utilize ...rest without having to define any variables in the function body.

#### References

- [Typescript 3.0 release notes: Explicit types on default props](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#explicit-types-on-defaultprops)
- [Mozilla Javascript reference: Default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters)
- [Mozilla Javascript reference: Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
