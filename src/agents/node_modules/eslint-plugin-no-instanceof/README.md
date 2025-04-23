# eslint-plugin-no-instanceof

Disallows use of instanceof operator, useful in TS envs where code relies purely on structural typing (i.e. static typing based on presence of attributes)

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-no-instanceof`:

```
$ npm install eslint-plugin-no-instanceof --save-dev
```


## Usage

Add `no-instanceof` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "no-instanceof"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "no-instanceof/no-instanceof": 2
    }
}
```

## Supported Rules

* `no-instanceof`





