import {
  Assert,
  Call,
  CreateBuiltinFunction,
  CreateDataProperty,
  Get,
  GetMethod,
  GetV,
  ObjectCreate,
  ToBoolean,
} from './all.mjs';
import {
  surroundingAgent,
} from '../engine.mjs';
import {
  New as NewValue,
  Type,
  wellKnownSymbols,
} from '../value.mjs';
import {
  Completion,
  Q, X,
} from '../completion.mjs';

// #sec-createasyncfromsynciterator
export function CreateAsyncFromSyncIterator(syncIteratorRecord) {
  const asyncIterator = X(ObjectCreate(surroundingAgent.intrinsic('%AsyncFromSyncIteratorPrototype%'), [
    'SyncIteratorRecord',
  ]));
  asyncIterator.SyncIteratorRecord = syncIteratorRecord;
  return Q(GetIterator(asyncIterator, 'async'));
}

// #sec-getiterator
export function GetIterator(obj, hint, method) {
  if (!hint) {
    hint = 'sync';
  }
  if (!method) {
    if (hint === 'async') {
      method = Q(GetMethod(obj, wellKnownSymbols.asyncIterator));
      if (Type(method) === 'Undefined') {
        const syncMethod = Q(GetMethod(obj, wellKnownSymbols.iterator));
        const syncIteratorRecord = Q(GetIterator(obj, 'sync', syncMethod));
        return Q(CreateAsyncFromSyncIterator(syncIteratorRecord));
      }
    } else {
      method = Q(GetMethod(obj, wellKnownSymbols.iterator));
    }
  }
  const iterator = Q(Call(method, obj));
  if (Type(iterator) !== 'Object') {
    return surroundingAgent.Throw('TypeError');
  }
  const nextMethod = Q(GetV(iterator, NewValue('next')));
  const iteratorRecord = {
    Iterator: iterator,
    NextMethod: nextMethod,
    Done: NewValue(false),
  };
  return iteratorRecord;
}

// #sec-iteratornext
export function IteratorNext(iteratorRecord, value) {
  let result;
  if (!value) {
    result = Q(Call(iteratorRecord.NextMethod, iteratorRecord.Iterator, []));
  } else {
    result = Q(Call(iteratorRecord.NextMethod, iteratorRecord.Iterator, [value]));
  }
  if (Type(result) !== 'Object') {
    return surroundingAgent.Throw('TypeError');
  }
  return result;
}

// #sec-iteratorcomplete
export function IteratorComplete(iterResult) {
  Assert(Type(iterResult) === 'Object');
  return ToBoolean(Q(Get(iterResult, NewValue('done'))));
}

// #sec-iteratorvalue
export function IteratorValue(iterResult) {
  Assert(Type(iterResult) === 'Object');
  return Q(Get(iterResult, NewValue('value')));
}

// #sec-iteratorstep
export function IteratorStep(iteratorRecord) {
  const result = Q(IteratorNext(iteratorRecord));
  const done = Q(IteratorComplete(result));
  if (done.isTrue()) {
    return NewValue(false);
  }
  return result;
}

// #sec-iteratorclose
export function IteratorClose(
  iteratorRecord,
  completion,
) {
  Assert(Type(iteratorRecord.Iterator) === 'Object');
  Assert(completion instanceof Completion);
  const iterator = iteratorRecord.Iterator;
  const ret = Q(GetMethod(iterator, NewValue('return')));
  if (Type(ret) === 'Undefined') {
    return completion;
  }
  const innerResult = Call(ret, iterator, []);
  if (completion.Type === 'throw') {
    return completion;
  }
  if (innerResult.Type === 'throw') {
    return innerResult;
  }
  if (Type(innerResult.Value) !== 'Object') {
    return surroundingAgent.Throw('TypeError');
  }
  return completion;
}

// #sec-createiterresultobject
export function CreateIterResultObject(value, done) {
  Assert(Type(done) === 'Boolean');
  const obj = ObjectCreate(surroundingAgent.intrinsic('%ObjectPrototype%'));
  CreateDataProperty(obj, NewValue('value'), value);
  CreateDataProperty(obj, NewValue('done'), done);
  return obj;
}

function ListIteratorNextSteps(args, { thisValue }) {
  const O = thisValue;
  Assert(Type(O) === 'Object');
  Assert('IteratedList' in O);
  const list = O.IteratedList;
  const index = O.ListIteratorNextIndex;
  const len = list.length;
  if (index >= len) {
    return CreateIterResultObject(NewValue(undefined), NewValue(true));
  }
  O.ListIteratorNextIndex += 1;
  return CreateIterResultObject(list[index], NewValue(false));
}

// #sec-createlistiteratorRecord
export function CreateListIteratorRecord(list) {
  const iterator = ObjectCreate(surroundingAgent.intrinsic('%IteratorPrototype%'), [
    'IteratedList',
    'ListIteratorNextIndex',
  ]);
  iterator.IteratedList = list;
  iterator.ListIteratorNextIndex = 0;
  const steps = ListIteratorNextSteps;
  const next = CreateBuiltinFunction(steps, []);
  return {
    Iterator: iterator,
    NextMethod: next,
    Done: NewValue(false),
  };
}
