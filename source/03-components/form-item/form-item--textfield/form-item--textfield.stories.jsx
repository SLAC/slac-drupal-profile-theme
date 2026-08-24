import parse from 'html-react-parser';

import twigTemplate from '../form-item.twig';
import inputTemplate from '../_input.twig';
import labelTemplate from '../_form-item-label.twig';
import colorData from './form-item--color.yml';
import dateData from './form-item--date.yml';
import emailData from './form-item--email.yml';
import fileData from './form-item--file.yml';
import monthData from './form-item--month.yml';
import numberDecimalData from './form-item--number-decimal.yml';
import numberFloatData from './form-item--number-float.yml';
import numberIntegerData from './form-item--number-integer.yml';
import passwordData from './form-item--password.yml';
import rangeData from '../form-item--range/form-item--range.yml';
import searchData from './form-item--search.yml';
import telData from './form-item--tel.yml';
import textData from './form-item--text.yml';
import timeData from './form-item--time.yml';
import urlData from './form-item--url.yml';
import weekData from './form-item--week.yml';

const settings = {
  title: 'Components/Form Item/Input',
  argTypes: {
    label_display: {
      options: ['before', 'after', 'invisible', 'hidden'],
      control: { type: 'select' },
    },
    description_display: {
      options: ['before', 'after', 'invisible', 'hidden'],
      control: { type: 'select' },
    },
  },
};

const colorLabel = args => labelTemplate({ ...args });
const colorChildren = args => inputTemplate({ ...args });
const Color = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: colorLabel(args),
        children: colorChildren(args),
      })
    ),
  args: { ...colorData },
};

const dateLabel = args => labelTemplate({ ...args });
const dateChildren = args => inputTemplate({ ...args });
const Date = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: dateLabel(args),
        children: dateChildren(args),
      })
    ),
  args: { ...dateData },
};

const emailLabel = args => labelTemplate({ ...args });
const emailChildren = args => inputTemplate({ ...args });
const Email = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: emailLabel(args),
        children: emailChildren(args),
      })
    ),
  args: { ...emailData },
};

const fileLabel = args => labelTemplate({ ...args });
const fileChildren = args => inputTemplate({ ...args });
const File = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: fileLabel(args),
        children: fileChildren(args),
      })
    ),
  args: { ...fileData },
};

const monthLabel = args => labelTemplate({ ...args });
const monthChildren = args => inputTemplate({ ...args });
const Month = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: monthLabel(args),
        children: monthChildren(args),
      })
    ),
  args: { ...monthData },
};

const numberLabel = args => labelTemplate({ ...args });
const numberChildren = args => inputTemplate({ ...args });
const NumberDecimal = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: numberLabel(args),
        children: numberChildren(args),
      })
    ),
  args: { ...numberDecimalData },
};

const numberFloatLabel = args => labelTemplate({ ...args });
const numberFloatChildren = args => inputTemplate({ ...args });
const NumberFloat = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: numberFloatLabel(args),
        children: numberFloatChildren(args),
      })
    ),
  args: { ...numberFloatData },
};

const numberIntLabel = args => labelTemplate({ ...args });
const numberIntChildren = args => inputTemplate({ ...args });
const NumberInteger = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: numberIntLabel(args),
        children: numberIntChildren(args),
      })
    ),
  args: { ...numberIntegerData },
};

const passwordLabel = args => labelTemplate({ ...args });
const passwordChildren = args => inputTemplate({ ...args });
const Password = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: passwordLabel(args),
        children: passwordChildren(args),
      })
    ),
  args: { ...passwordData },
};

const rangeLabel = args => labelTemplate({ ...args });
const rangeChildren = args => inputTemplate({ ...args });
const Range = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: rangeLabel(args),
        children: rangeChildren(args),
      })
    ),
  args: { ...rangeData },
};

const searchLabel = args => labelTemplate({ ...args });
const searchChildren = args => inputTemplate({ ...args });
const Search = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: searchLabel(args),
        children: searchChildren(args),
      })
    ),
  args: { ...searchData },
};

const telephoneLabel = args => labelTemplate({ ...args });
const telephoneChildren = args => inputTemplate({ ...args });
const Telephone = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: telephoneLabel(args),
        children: telephoneChildren(args),
      })
    ),
  args: { ...telData },
};

const textLabel = args => labelTemplate({ ...args });
const textChildren = args => inputTemplate({ ...args });
const Text = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: textLabel(args),
        children: textChildren(args),
      })
    ),
  args: { ...textData },
};

const timeLabel = args => labelTemplate({ ...args });
const timeChildren = args => inputTemplate({ ...args });
const Time = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: timeLabel(args),
        children: timeChildren(args),
      })
    ),
  args: { ...timeData },
};

const urlLabel = args => labelTemplate({ ...args });
const urlChildren = args => inputTemplate({ ...args });
const URL = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: urlLabel(args),
        children: urlChildren(args),
      })
    ),
  args: { ...urlData },
};

const weekLabel = args => labelTemplate({ ...args });
const weekChildren = args => inputTemplate({ ...args });
const Week = {
  render: args =>
    parse(
      twigTemplate({
        ...args,
        label: weekLabel(args),
        children: weekChildren(args),
      })
    ),
  args: { ...weekData },
};

export default settings;
export {
  Color,
  Date,
  Email,
  File,
  Month,
  NumberDecimal,
  NumberFloat,
  NumberInteger,
  Password,
  Range,
  Search,
  Telephone,
  Text,
  Time,
  URL,
  Week,
};
